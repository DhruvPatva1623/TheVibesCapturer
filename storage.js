/**
 * TvC Clicks — Storage Manager
 * Uses Firebase Firestore as the Master Database
 * Uses Firebase Storage & Backblaze B2 for File Storage
 */

import CONFIG from "./config.js?v=2";
import { 
  db, 
  storage as firebaseStorage, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc,
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "./firebase-client.js";

const progressCallbacks = [];
export function onProgress(cb) {
  progressCallbacks.push(cb);
}
function emitProgress(id, percent, status) {
  progressCallbacks.forEach((cb) => cb({ id, percent, status }));
}

// ─── Firebase Storage Upload ────────────────────────────────────────────────
async function uploadToFirebase(file, metadata) {
  return new Promise((resolve, reject) => {
    const id = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${id}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storageRef = ref(firebaseStorage, `media/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        emitProgress(id, Math.round(progress), "uploading");
      }, 
      (error) => {
        emitProgress(id, 0, "error");
        reject(error);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        const item = {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          event: metadata.event || "General",
          subsection: metadata.subsection || "photos",
          category: metadata.category || "",
          title: metadata.title || file.name,
          url: downloadURL,
          uploadedAt: serverTimestamp(),
          storageTarget: "firebase",
        };

        // Save metadata to Firestore
        await addDoc(collection(db, "media"), item);
        emitProgress(id, 100, "done");
        resolve(item);
      }
    );
  });
}

// ─── Cloudinary Mode (100% Free, No Server Needed) ───────────────────────────
async function uploadToCloudinary(file, metadata) {
  const id = `cld_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { cloudName, uploadPreset } = CONFIG.cloudinary;

  if (cloudName === "YOUR_CLOUD_NAME") {
    throw new Error("Please configure your Cloudinary cloudName in config.js first!");
  }

  try {
    emitProgress(id, 10, "uploading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    // Determine the resource type for Cloudinary API URL
    const isVideo = file.type.startsWith("video/");
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`;

    const xhr = new XMLHttpRequest();
    
    // Wrap XHR in a promise to track progress
    const uploadRes = await new Promise((resolve, reject) => {
      xhr.open("POST", endpoint, true);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          // Cloudinary gives direct upload progress!
          const percentComplete = (e.loaded / e.total) * 100;
          // Scale it to 10-95% to leave room for final processing
          const scaledPercent = 10 + (percentComplete * 0.85);
          emitProgress(id, Math.round(scaledPercent), "uploading");
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Cloudinary upload failed: ${xhr.responseText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });

    emitProgress(id, 95, "processing");

    // The secure URL is directly provided by Cloudinary
    const publicUrl = uploadRes.secure_url;

    // Save metadata to Firestore (Database)
    const item = {
      id: uploadRes.public_id,
      name: file.name,
      type: file.type,
      size: file.size,
      event: metadata.event || "General",
      subsection: metadata.subsection || "photos",
      category: metadata.category || "",
      title: metadata.title || file.name,
      url: publicUrl,
      uploadedAt: serverTimestamp(),
      storageTarget: "cloudinary",
    };

    await addDoc(collection(db, "media"), item);
    emitProgress(id, 100, "done");
    return item;
  } catch (err) {
    emitProgress(id, 0, "error");
    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function uploadMedia(file, metadata, targetCloud = "firebase") {
  if (targetCloud === "cloudinary") {
    return uploadToCloudinary(file, metadata);
  }
  return uploadToFirebase(file, metadata);
}

// ─── External Link Support ──────────────────────────────────────────────────
export async function saveExternalLink(url, metadata) {
  const item = {
    id: `link_${Date.now()}`,
    name: metadata.title || "External Link",
    type: "link",
    size: 0,
    event: metadata.event || "General",
    subsection: metadata.subsection || "videos",
    category: metadata.category || "",
    title: metadata.title || "",
    url: url, 
    uploadedAt: serverTimestamp(),
    storageTarget: "external",
  };

  await addDoc(collection(db, "media"), item);
  return item;
}

// ─── Master Database Reads (Firestore) ──────────────────────────────────────
export async function getAllMedia() {
  const q = query(collection(db, "media"), orderBy("uploadedAt", "desc"));
  const querySnapshot = await getDocs(q);
  const items = [];
  querySnapshot.forEach((doc) => {
    items.push({ docId: doc.id, ...doc.data() });
  });
  return items;
}

export async function deleteMedia(docId, itemData) {
  await deleteDoc(doc(db, "media", docId));
}

export async function softDeleteMedia(docId) {
  await setDoc(doc(db, "media", docId), { deleted: true }, { merge: true });
}

export async function restoreMedia(docId) {
  await setDoc(doc(db, "media", docId), { deleted: false }, { merge: true });
}

export async function updateMedia(docId, data) {
  await setDoc(doc(db, "media", docId), data, { merge: true });
}

export async function getStorageStats() {
  const items = await getAllMedia();
  let fbSize = 0;
  let cldSize = 0;
  let linkCount = 0;

  items.forEach(i => {
    if (i.storageTarget === "firebase") fbSize += (i.size || 0);
    if (i.storageTarget === "cloudinary") cldSize += (i.size || 0);
    if (i.type === "link") linkCount++;
  });

  return {
    count: items.length,
    linkCount,
    fbSizeGB: (fbSize / 1024 / 1024 / 1024).toFixed(3),
    cldSizeGB: (cldSize / 1024 / 1024 / 1024).toFixed(3),
    fbPercent: Math.min((fbSize / (5 * 1024 * 1024 * 1024)) * 100, 100).toFixed(1),
    cldPercent: Math.min((cldSize / (25 * 1024 * 1024 * 1024)) * 100, 100).toFixed(1)
  };
}

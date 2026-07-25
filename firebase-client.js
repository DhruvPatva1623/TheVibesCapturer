import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import CONFIG from "./config.js";

const app = initializeApp(CONFIG.firebase);
const db = getFirestore(app);
const storage = getStorage(app);

export { 
    app, 
    db, 
    storage, 
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
};

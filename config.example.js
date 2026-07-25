/**
 * TvC Clicks — Cloud Storage & Admin Configuration
 * =====================================================
 * This is an EXAMPLE configuration file. 
 * Rename this file to `config.js` and add your real credentials.
 */

const CONFIG = {
  // ── Firebase Config (For Database ONLY) ───────────────────────────────
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID",
    measurementId: "YOUR_FIREBASE_MEASUREMENT_ID"
  },

  // ── Cloudinary Config (For Free Photo & Video Storage) ────────────────
  cloudinary: {
    cloudName: "YOUR_CLOUDINARY_CLOUD_NAME",
    uploadPreset: "YOUR_CLOUDINARY_UPLOAD_PRESET" 
  },

  // ── Admin Password ─────────────────────────────────────────────────────────
  adminPassword: "CHANGE_ME",

  // ── Site Settings ──────────────────────────────────────────────────────────
  site: {
    name: "TvC Clicks",
    tagline: "Just Capture Every Moments !!!",
    email: "your_email@example.com",
    instagram: "https://instagram.com/your_handle",
    youtube: "https://youtube.com/@your_handle",
    whatsapp: "+91 XXXXXXXXXX",
  }
};

export default CONFIG;

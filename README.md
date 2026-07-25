# TvC Clicks — Portfolio Website

> *Just Capture Every Moments !!!*

A professional video editor & cinematographer portfolio with **cloud storage** for permanent media hosting. Built as a pure HTML/CSS/JS site deployable on **GitHub Pages** for free.

---

## 🚀 Features

| Feature | Detail |
|---|---|
| 📷 Photo Gallery | Masonry grid with filter tabs (Photos, Videos, Edited, Other) |
| 🎬 Video Reel | Featured player with scrollable playlist |
| ✨ Before & After | Side-by-side editing showcase |
| 🌐 Bilingual | English + Hindi toggle |
| 🔐 Admin Panel | Password-protected upload/manage/delete |
| ☁️ Cloud Storage | Backblaze B2 + Cloudflare Worker (10GB+ free) |
| 📱 Responsive | Mobile-first design |
| 💡 SEO Optimized | Meta tags, Open Graph, semantic HTML |

---

## ☁️ Cloud Storage Setup (Backblaze B2)

### Step 1: Create Backblaze Account
1. Go to [backblaze.com/b2/sign-up.html](https://www.backblaze.com/b2/sign-up.html)
2. Sign up for a free account (10GB free storage)

### Step 2: Create a Bucket
1. Go to **B2 Cloud Storage → Buckets**
2. Click **Create a Bucket**
3. Name: `tvc-clicks-media`
4. Files in Bucket: **Public**
5. Click **Create a Bucket**

### Step 3: Create an App Key
1. Go to **Account → App Keys**
2. Click **Add a New Application Key**
3. Name it `tvc-portfolio-key`
4. Allow access to: `tvc-clicks-media`
5. Copy the **Key ID** and **Application Key**

### Step 4: Deploy Cloudflare Worker
1. Go to [workers.cloudflare.com](https://workers.cloudflare.com/)
2. Create a free account
3. Click **Create a Worker**
4. Paste the contents of `worker/b2-worker.js`
5. Click **Save and Deploy**
6. Copy your worker URL (e.g., `https://tvc-b2.yourname.workers.dev`)

### Step 5: Configure `config.js`
```javascript
const CONFIG = {
  b2: {
    workerUrl: "https://YOUR_WORKER.workers.dev",
    bucketName: "tvc-clicks-media",
    publicUrl: "https://f002.backblazeb2.com/file/tvc-clicks-media",
    keyId: "YOUR_KEY_ID_HERE",
    appKey: "YOUR_APP_KEY_HERE",
  },
  adminPassword: "YourStrongPassword123!",
  storageMode: "b2",  // ← Change from "local" to "b2"
};
```

---

## 🌐 Deploy to GitHub Pages

### Option 1: GitHub Web UI
1. Create a new GitHub repository named `tvc-clicks` (or any name)
2. Upload all files from this folder
3. Go to **Settings → Pages**
4. Source: **Deploy from a branch**
5. Branch: `main` / `root`
6. Click **Save** — your site will be live at `https://yourusername.github.io/tvc-clicks/`

### Option 2: Git CLI
```bash
git init
git add .
git commit -m "Initial TvC Clicks portfolio"
git remote add origin https://github.com/YOURUSERNAME/tvc-clicks.git
git push -u origin main
```
Then enable GitHub Pages in repository Settings.

---

## 🔐 Admin Panel

- Click the **Admin** button in the navbar
- Default password: `TvC@Admin2024!` *(change this in `config.js`)*
- Once logged in, you can:
  - **Upload** photos and videos to cloud storage
  - **Manage** — edit titles or delete files
  - **Settings** — view storage info & update password

> ⚠️ **IMPORTANT**: Change `adminPassword` in `config.js` before deploying!

---

## 📁 Project Structure

```
TvC_Clicks/
├── index.html          # Main portfolio page
├── style.css           # All styles
├── app.js              # Application logic
├── storage.js          # Cloud storage manager
├── config.js           # ⚙️ Configuration (edit this!)
├── assets/
│   ├── hero_bg.png     # Hero background image
│   └── tvc_logo.png    # Brand logo
└── worker/
    └── b2-worker.js    # Cloudflare Worker for B2
```

---

## 🛠 Tech Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Storage**: Backblaze B2 (10GB free) + Cloudflare Workers (proxy)
- **Hosting**: GitHub Pages (free, static)
- **Fonts**: Google Fonts (Outfit + Playfair Display)

---

## 📧 Contact

- Email: tvcclicks@gmail.com
- Instagram: @tvc_clicks
- YouTube: @tvcclicks

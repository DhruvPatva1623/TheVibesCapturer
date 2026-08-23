/**
 * TvC Clicks — Main Application
 * =====================================
 * Handles: Gallery, Admin, Uploads, Lightbox, Language, Scroll FX
 */

import {
  uploadMedia,
  getAllMedia,
  deleteMedia,
  softDeleteMedia,
  restoreMedia,
  updateMedia,
  getStorageStats,
  onProgress,
  saveExternalLink
} from "./storage.js?v=4";

import CONFIG from "./config.js?v=3";

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
const state = {
  lang: "en",
  isAdmin: false,
  adminSessionKey: "tvc_admin_session",
  currentFilter: "all",
  lightboxItems: [],
  lightboxIndex: 0,
  pendingFiles: [],
  uploadCount: 0,
  itemsPerPage: 12,
  displayedCount: 0,
  customPassword: null,
};

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  try { initNav(); } catch(e) {}
  try { loadGallery(); } catch(e) {}
  try { checkAdminSession(); } catch(e) {}
  try { updateFooterYear(); } catch(e) {}
  try { initKeyboardShortcuts(); } catch(e) {}
  try { onProgress(handleUploadProgress); } catch(e) {}

  // Load reel URL if saved
  try {
    const reelUrl = localStorage.getItem('tvc_reel_url');
    if (reelUrl) {
      const input = document.getElementById('reel-url-input');
      if (input) input.value = reelUrl;
    }
  } catch(e) {}
});

// ═══════════════════════════════════════════════════════════
// NAV & SCROLL
// ═══════════════════════════════════════════════════════════
function initNav() {
  const navbar = document.getElementById("navbar");
  const navLinks = document.querySelectorAll(".nav-links a");

  // Scroll-based nav active state & shadow
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  document.querySelectorAll("section[id]").forEach((sec) => observer.observe(sec));

  // Navbar scroll shadow
  window.addEventListener("scroll", () => {
    if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });
}

function initScrollFX() {
  const fadels = document.querySelectorAll(".fade-in");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  fadels.forEach((el) => io.observe(el));
}

function counterAnimation() {
  const nums = document.querySelectorAll(".stat-number[data-count]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCount(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach((el) => io.observe(el));
}

function animateCount(el) {
  const target = parseInt(el.dataset.count);
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target) + (target >= 100 ? "+" : "");
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function updateFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
}

// ═══════════════════════════════════════════════════════════
// MOBILE NAV
// ═══════════════════════════════════════════════════════════
window.toggleMobileNav = function () {
  const nav = document.getElementById("mobile-nav");
  const btn = document.getElementById("hamburger");
  const open = nav.classList.toggle("open");
  btn.setAttribute("aria-expanded", open);
};

window.closeMobileNav = function () {
  document.getElementById("mobile-nav").classList.remove("open");
  document.getElementById("hamburger").setAttribute("aria-expanded", false);
};

// ═══════════════════════════════════════════════════════════
// LANGUAGE SWITCH
// ═══════════════════════════════════════════════════════════
window.switchLang = function (lang) {
  state.lang = lang;
  document.getElementById("lang-en").classList.toggle("active", lang === "en");
  document.getElementById("lang-hi").classList.toggle("active", lang === "hi");

  // Update all [data-en] / [data-hi] elements
  document.querySelectorAll("[data-en]").forEach((el) => {
    const val = el.getAttribute(`data-${lang}`);
    if (val) el.textContent = val;
  });

  // Update placeholder attributes
  document.querySelectorAll("[data-en-placeholder]").forEach((el) => {
    const val = el.getAttribute(`data-${lang}-placeholder`);
    if (val) el.setAttribute("placeholder", val);
  });

  document.documentElement.lang = lang === "hi" ? "hi" : "en";
};

// ═══════════════════════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════════════════════
async function renderGalleryFilters(items) {
  const filterContainer = document.getElementById("gallery-filters");
  if (!filterContainer) return;

  const activeItems = items.filter(i => !i.deleted);
  
  // Calculate item counts per category/subsection
  const counts = {};
  activeItems.forEach(i => {
    const cat = (i.category || i.subsection || "general").toLowerCase();
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const categories = Object.keys(counts);

  filterContainer.innerHTML = "";
  
  // All Pill
  const allBtn = document.createElement("button");
  allBtn.className = `filter-pill ${state.currentFilter === 'all' ? 'active' : ''}`;
  allBtn.dataset.filter = 'all';
  allBtn.innerHTML = `📁 ALL (${activeItems.length})`;
  filterContainer.appendChild(allBtn);

  // Category Pills with icons and counts
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `filter-pill ${state.currentFilter === cat ? 'active' : ''}`;
    btn.dataset.filter = cat;
    
    let icon = "📂";
    if (cat.includes("photo")) icon = "📷";
    if (cat.includes("video") || cat.includes("film") || cat.includes("reel")) icon = "🎬";
    if (cat.includes("glimpse")) icon = "✨";
    if (cat.includes("random")) icon = "🎨";

    btn.innerHTML = `${icon} ${cat.toUpperCase()} (${counts[cat]})`;
    filterContainer.appendChild(btn);
  });

  // Re-bind clicks
  filterContainer.querySelectorAll('.filter-pill').forEach(btn => {
    btn.onclick = () => {
      filterContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadGallery(btn.dataset.filter);
    };
  });
}

async function loadGallery(filter = "all") {
  state.currentFilter = filter;
  state.displayedCount = 0;

  const grid = document.getElementById("gallery-grid");
  const empty = document.getElementById("gallery-empty");
  
  let items = await getAllMedia();
  
  // Render filters dynamically
  await renderGalleryFilters(items);

  if (filter === "recent") {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    items = items.filter(i => i.uploadedAt && i.uploadedAt.toMillis && (i.uploadedAt.toMillis() >= oneWeekAgo) && !i.deleted);
  } else if (filter !== "all") {
    items = items.filter(i => ((i.category || "").toLowerCase() === filter || (i.subsection || "").toLowerCase() === filter) && !i.deleted);
  } else {
    items = items.filter(i => !i.deleted);
  }

  // Clear grid (keep empty placeholder)
  Array.from(grid.children).forEach((c) => {
    if (c.id !== "gallery-empty") c.remove();
  });

  if (!items.length) {
    if (empty) empty.style.display = "flex";
    state.lightboxItems = [];
    return;
  }

  if (empty) empty.style.display = "none";
  state.lightboxItems = items;

  const toShow = items.slice(0, state.itemsPerPage);
  toShow.forEach((item, i) => grid.appendChild(createGalleryItem(item, i)));
  state.displayedCount = toShow.length;
  observeDynamicReveals();
}

function createGalleryItem(item, index) {
  const div = document.createElement("div");
  const isVideo = item.type && item.type.startsWith("video");
  const isLink = item.type === "link";

  // Featured: every 1st item and every 7th item
  const isFeatured = (index === 0 || index % 7 === 0);

  let className = "gallery-item";
  if (isFeatured) className += " gallery-item--featured";
  if (isVideo) className += " gallery-item--video";
  else if (isLink) className += " gallery-item--link";

  div.className = className;
  div.setAttribute("role", "listitem");
  div.setAttribute("tabindex", "0");
  div.setAttribute("data-reveal", "mask-sweep");
  div.title = "Click to open";

  div.addEventListener("click", function (e) {
    if (e.target.closest(".editor-action-btn")) return;
    openLightbox(index);
  });
  div.onkeydown = (e) => e.key === "Enter" && openLightbox(index);

  const mediaSrc = item.url;
  const folderName = item.event || item.category || item.subsection || "General";
  const titleText = item.title || item.name || "Visual Capture";
  const descText = item.description || (isVideo ? "Video Clip" : isLink ? "External Media" : "Photography");
  const itemId = item.docId || item.id;

  // YouTube thumbnail extraction
  let thumbSrc = mediaSrc;
  if (isLink && (mediaSrc.includes("youtu") || mediaSrc.includes("youtube.com"))) {
    let vidId = "";
    if (mediaSrc.includes("v=")) vidId = mediaSrc.split("v=")[1].split("&")[0];
    else if (mediaSrc.includes("youtu.be/")) vidId = mediaSrc.split("youtu.be/")[1].split("?")[0];
    else if (mediaSrc.includes("/shorts/")) vidId = mediaSrc.split("/shorts/")[1].split("?")[0];
    if (vidId) thumbSrc = `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`;
  }

  // Recent badge — uploaded within last 7 days
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const uploadedMs = item.uploadedAt && item.uploadedAt.toMillis ? item.uploadedAt.toMillis() : (item.uploadedAt ? new Date(item.uploadedAt).getTime() : 0);
  const isNew = uploadedMs >= oneWeekAgo;

  div.innerHTML = `
    <div class="gallery-media-wrapper">
      ${isNew ? `<div class="media-new-badge">✦ New</div>` : ""}
      <div class="media-badge-container">
        <span class="media-type-badge">${isVideo ? "🎬 Video" : isLink ? "▶ Link" : "📷 Photo"}</span>
        <span class="media-folder-badge">📂 ${escHtml(folderName)}</span>
      </div>
      ${isVideo
        ? `<video src="${mediaSrc}" muted playsinline preload="metadata" style="pointer-events:none"></video>`
        : `<img src="${isLink ? thumbSrc : mediaSrc}" alt="${escHtml(titleText)}" loading="lazy" onerror="this.src='assets/TVC_logo.jpg'" />`
      }
      ${(isVideo || isLink) ? `
        <div class="gallery-play-btn" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      ` : ""}
      <div class="gallery-overlay">
        <div class="gallery-overlay-title">${escHtml(titleText)}</div>
        <div class="gallery-overlay-type">${isVideo ? "🎬 Video" : isLink ? "▶ Linked" : "📷 Photo"} · ${escHtml(item.subsection || item.event || "")}</div>
      </div>
      <div class="editor-overlay">
        <button class="editor-action-btn editor-edit-btn"
          onclick="event.stopPropagation(); editMediaItem('${itemId}')">✏️ Edit</button>
        <button class="editor-action-btn editor-move-btn"
          onclick="event.stopPropagation(); moveMediaItem('${itemId}')">📁 Move</button>
        <button class="editor-action-btn editor-delete-btn"
          onclick="event.stopPropagation(); deleteMediaItem('${itemId}')">🗑️ Del</button>
      </div>
    </div>
    <div class="gallery-card-info">
      <div class="gallery-card-title">${escHtml(titleText)}</div>
      <div class="gallery-card-subtitle">${escHtml(descText)}</div>
    </div>
  `;

  return div;
}

window.loadMoreItems = function () {
  const items =
    state.currentFilter === "all"
      ? getAllMedia()
      : getMediaByCategory(state.currentFilter);

  const grid = document.getElementById("gallery-grid");
  const lmWrap = document.getElementById("load-more-wrap");
  const next = items.slice(state.displayedCount, state.displayedCount + state.itemsPerPage);

  next.forEach((item, i) =>
    grid.appendChild(createGalleryItem(item, state.displayedCount + i))
  );
  state.displayedCount += next.length;
  observeDynamicReveals();

  if (state.displayedCount >= items.length) {
    lmWrap.style.display = "none";
  }
};

function observeDynamicReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("revealed"), parseInt(e.target.dataset.delay || 0));
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
  document.querySelectorAll('.gallery-item[data-reveal]:not(.revealed), .reveal-up:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed), .reveal-zoom:not(.revealed)').forEach(el => io.observe(el));
}

// Filter pills (new design)
document.addEventListener('click', e => {
  const btn = e.target.closest('.filter-pill');
  if (!btn) return;
  document.querySelectorAll('.filter-pill').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  loadGallery(btn.getAttribute('data-filter'));
});

// ═══════════════════════════════════════════════════════════
// REEL PLAYLIST
// ═══════════════════════════════════════════════════════════
function loadReelPlaylist() {
  const videos = getMediaByCategory("video");
  const playlist = document.getElementById("reel-playlist");
  playlist.innerHTML = "";

  if (!videos.length) return;

  // Show first video in player
  playReelVideo(videos[0]);

  videos.forEach((v, i) => {
    const thumb = document.createElement("div");
    thumb.className = "reel-thumb" + (i === 0 ? " active" : "");
    thumb.innerHTML = `
      <video src="${v.url}" muted preload="metadata" style="pointer-events:none"></video>
      <div class="reel-thumb-title">${escHtml(v.title || v.name)}</div>
    `;
    thumb.onclick = () => {
      document.querySelectorAll(".reel-thumb").forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
      playReelVideo(v);
    };
    playlist.appendChild(thumb);
  });
}

function playReelVideo(item) {
  const player = document.getElementById("main-reel-video");
  const placeholder = document.getElementById("reel-placeholder");
  player.src = item.url;
  player.style.display = "block";
  placeholder.style.display = "none";
}

// ═══════════════════════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════════════════════
window.openLightbox = function (index) {
  state.lightboxIndex = index;
  renderLightbox();
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
};

window.closeLightbox = function () {
  const lb = document.getElementById("lightbox");
  lb.classList.remove("open");
  lb.classList.remove("max-preview");
  document.body.style.overflow = "";
  // Clear innerHTML to destroy iframes and video tags so sound stops
  const media = document.getElementById("lightbox-media");
  if (media) media.innerHTML = "";
};

window.closeLightboxOnBg = function (e) {
  const lb = document.getElementById("lightbox");
  if (e.target === lb || e.target === document.querySelector(".lightbox-content")) {
    closeLightbox();
  }
};

window.navigateLightbox = function (dir) {
  const total = state.lightboxItems.length;
  state.lightboxIndex = (state.lightboxIndex + dir + total) % total;
  renderLightbox();
};

window.toggleMaxPreview = function () {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  const isMax = lb.classList.toggle("max-preview");
  const icon = document.getElementById("lb-max-icon");
  const btn = document.getElementById("lightbox-max-btn");
  if (icon) icon.textContent = isMax ? "🗗" : "⛶";
  if (btn) btn.classList.toggle("active-max", isMax);
  showToast(isMax ? "⛶ Max Preview Mode Enabled" : "Exit Max Preview", "info");
};

window.toggleImageZoom = function (e) {
  if (e.target && e.target.tagName === "IMG") {
    e.target.classList.toggle("zoomed");
  }
};

function renderLightbox() {
  const item = state.lightboxItems[state.lightboxIndex];
  if (!item) return;

  const media = document.getElementById("lightbox-media");
  const isVideo = item.type && item.type.startsWith("video");
  const isLink = item.type === "link";
  
  if (isVideo) {
    media.innerHTML = `<video src="${item.url}" controls autoplay playsinline style="max-width:100%; max-height:85vh; border-radius:8px;"></video>`;
  } else if (isLink && (item.url.includes("youtu") || item.url.includes("youtube.com"))) {
    // Extract YouTube ID for iframe embed
    let vidId = "";
    if (item.url.includes("v=")) {
      vidId = item.url.split("v=")[1].split("&")[0];
    } else if (item.url.includes("youtu.be/")) {
      vidId = item.url.split("youtu.be/")[1].split("?")[0];
    } else if (item.url.includes("/shorts/")) {
      vidId = item.url.split("/shorts/")[1].split("?")[0];
    }
    media.innerHTML = `<iframe style="width:90vw; height:calc(90vw * 9 / 16); max-height:80vh; max-width:calc(80vh * 16 / 9); border-radius:8px; border:none; box-shadow: 0 20px 60px rgba(0,0,0,0.8);" src="https://www.youtube.com/embed/${vidId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    // Standard image or non-YouTube link fallback
    media.innerHTML = `<img src="${item.url}" alt="${escHtml(item.title || item.name)}" style="max-width:100%; max-height:85vh; object-fit:contain; border-radius:8px;" onerror="this.src='assets/TVC_logo.jpg'" title="Click image to Zoom In / Zoom Out" />`;
  }

  // Update Full-Res link
  const fullresLink = document.getElementById("lightbox-fullres-link");
  if (fullresLink) {
    fullresLink.href = item.url;
  }

  const catEl = document.getElementById("lightbox-category");
  if (catEl) {
    const folder = item.category || item.subsection || "General";
    catEl.textContent = `📂 ${folder.toUpperCase()}`;
  }

  document.getElementById("lightbox-title").textContent = item.title || item.name || "Visual Capture";
  document.getElementById("lightbox-desc").textContent = item.description || "";

  // Render Admin Bar inside Lightbox if Admin Mode is active
  const adminBar = document.getElementById("lightbox-admin-bar");
  if (adminBar) {
    const itemId = item.docId || item.id;
    if (state.isAdmin) {
      adminBar.style.display = "flex";
      adminBar.innerHTML = `
        <button class="lb-admin-btn lb-edit-btn" onclick="editMediaItem('${itemId}')">✏️ Edit Details</button>
        <button class="lb-admin-btn lb-folder-btn" onclick="moveMediaItem('${itemId}')">📁 Move Folder</button>
        <button class="lb-admin-btn lb-delete-btn" onclick="deleteMediaItem('${itemId}')">🗑️ Delete</button>
        <button class="lb-admin-btn lb-copy-btn" onclick="copyMediaLink('${item.url}')">🔗 Copy Link</button>
      `;
    } else {
      adminBar.style.display = "flex";
      adminBar.innerHTML = `
        <button class="lb-admin-btn lb-copy-btn" onclick="copyMediaLink('${item.url}')">🔗 Copy Link</button>
      `;
    }
  }

  // Show/hide nav buttons
  document.getElementById("lightbox-prev").style.display =
    state.lightboxItems.length > 1 ? "flex" : "none";
  document.getElementById("lightbox-next").style.display =
    state.lightboxItems.length > 1 ? "flex" : "none";
}

// ═══════════════════════════════════════════════════════════
// ADMIN AUTH
// ═══════════════════════════════════════════════════════════
function checkAdminSession() {
  const session = sessionStorage.getItem(state.adminSessionKey);
  if (session === "true") {
    state.isAdmin = true;
    showAdminPanel();
  }
}

window.toggleAdmin = function () {
  const panel = document.getElementById("admin-panel");
  const overlay = document.getElementById("admin-overlay");
  if (!panel) return;

  if (state.isAdmin) {
    // Toggle panel open/close
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'flex';
    if (overlay) overlay.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) refreshAdminPanel();
  } else {
    // Show login form
    panel.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';
    const loginForm = document.getElementById('admin-login-form');
    const adminContent = document.getElementById('admin-content');
    if (loginForm) loginForm.style.display = '';
    if (adminContent) adminContent.style.display = 'none';
    setTimeout(() => document.getElementById("admin-password")?.focus(), 100);
  }
};

window.checkAdminPassword = function () {
  const pw = document.getElementById("admin-password")?.value || '';
  const storedPw = state.customPassword || CONFIG.adminPassword;
  if (pw === storedPw) {
    state.isAdmin = true;
    sessionStorage.setItem(state.adminSessionKey, "true");
    if (document.getElementById('admin-password')) document.getElementById('admin-password').value = '';
    document.getElementById('editor-toggle-btn').style.display = 'flex';
    showAdminPanel();
    showToast("Welcome back, Admin!", "success");
  } else {
    showToast("Incorrect password.", "error");
    document.getElementById('admin-password').value = '';
  }
};

window.closeAdmin = function () {
  const panel = document.getElementById("admin-panel");
  const overlay = document.getElementById("admin-overlay");
  if (panel) panel.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
};

function showAdminPanel() {
  const loginForm = document.getElementById('admin-login-form');
  const adminContent = document.getElementById('admin-content');
  if (loginForm) loginForm.style.display = 'none';
  if (adminContent) adminContent.style.display = '';
  document.getElementById('editor-toggle-btn').style.display = 'flex';
  refreshAdminPanel();
}

window.toggleEditorMode = function() {
  document.body.classList.toggle('editor-mode-active');
  const isActive = document.body.classList.contains('editor-mode-active');
  showToast(isActive ? "Supreme Editor Mode ON" : "Editor Mode OFF", "success");
}

function refreshAdminPanel() {
  updateAdminStats();
  renderAdminMediaList();
}

window.adminLogout = function () {
  state.isAdmin = false;
  sessionStorage.removeItem(state.adminSessionKey);
  window.closeAdmin();
  document.getElementById('editor-toggle-btn').style.display = 'none';
  document.body.classList.remove('editor-mode-active');
  const loginForm = document.getElementById('admin-login-form');
  const adminContent = document.getElementById('admin-content');
  if (loginForm) loginForm.style.display = '';
  if (adminContent) adminContent.style.display = 'none';
  showToast("Logged out successfully", "success");
};

window.changePassword = function () {
  const newPw = document.getElementById("new-password").value.trim();
  if (newPw.length < 6) {
    showToast("⚠️ Password must be at least 6 characters.", "warning");
    return;
  }
  state.customPassword = newPw;
  CONFIG.adminPassword = newPw;
  document.getElementById("new-password").value = "";
  showToast("✅ Password updated for this session.", "success");
};

// ═══════════════════════════════════════════════════════════
// ADMIN PANEL — TABS
// ═══════════════════════════════════════════════════════════
window.switchAdminTab = function (tab) {
  document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".admin-tab-content").forEach((c) => c.classList.remove("active"));
  document.querySelector(`[data-admin-tab="${tab}"]`).classList.add("active");
  document.getElementById(`tab-${tab}`).classList.add("active");

  if (tab === "manage") renderAdminMediaList();
};

async function updateAdminStats() {
  try {
    const stats = await getStorageStats();
    if (document.getElementById("stat-total")) {
      document.getElementById("stat-total").innerText = stats.count;
      document.getElementById("stat-links").innerText = stats.linkCount;
      
      document.getElementById("stat-fb-gb").innerText = stats.fbSizeGB;
      document.getElementById("storage-fb").style.width = stats.fbPercent + "%";
      
      document.getElementById("stat-b2-gb").innerText = stats.cldSizeGB;
      document.getElementById("storage-b2").style.width = stats.cldPercent + "%";
    }
  } catch(e) {}
}



// ═══════════════════════════════════════════════════════════
// ADMIN — UPLOAD
// ═══════════════════════════════════════════════════════════
window.handleDragOver = function (e) {
  e.preventDefault();
  document.getElementById("upload-zone").classList.add("drag-over");
};

window.handleDragLeave = function () {
  document.getElementById("upload-zone").classList.remove("drag-over");
};

window.handleDrop = function (e) {
  e.preventDefault();
  document.getElementById("upload-zone").classList.remove("drag-over");
  const files = Array.from(e.dataTransfer.files).filter(
    (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
  );
  addPendingFiles(files);
};

// ─── ADMIN UPLOAD UI LOGIC ──────────────────────────────────────────────────
let uploadMode = "file";

window.setUploadMode = function(mode) {
  uploadMode = mode;
  document.getElementById("btn-mode-file").className = mode === "file" ? "btn-primary" : "btn-ghost";
  document.getElementById("btn-mode-link").className = mode === "link" ? "btn-primary" : "btn-ghost";
  
  document.getElementById("zone-file").style.display = mode === "file" ? "block" : "none";
  document.getElementById("zone-link").style.display = mode === "link" ? "block" : "none";
  document.getElementById("upload-preview").style.display = mode === "file" ? "block" : "none";
};

window.handleFileUpload = function (files) {
  state.pendingFiles = Array.from(files);
  renderUploadPreviews();
};

function renderUploadPreviews() {
  const preview = document.getElementById("upload-preview");
  preview.innerHTML = "";
  state.pendingFiles.forEach((file, i) => {
    const item = document.createElement("div");
    item.className = "upload-preview-item";
    const url = URL.createObjectURL(file);
    item.innerHTML = `
      ${file.type.startsWith("video/")
        ? `<video src="${url}" muted preload="metadata"></video>`
        : `<img src="${url}" alt="Preview" loading="lazy" />`
      }
      <button class="upload-preview-remove" onclick="removePendingFile(${i})">✕</button>
    `;
    preview.appendChild(item);
  });
}

window.removePendingFile = function (i) {
  state.pendingFiles.splice(i, 1);
  renderUploadPreviews();
};


window.submitUpload = async function () {
  const eventName = document.getElementById("upload-event").value.trim();
  const subSection = document.getElementById("upload-subsection").value;
  const category = document.getElementById("upload-category").value.trim();
  const title = document.getElementById("upload-title").value.trim();
  
  if (!eventName) {
    showToast("⚠️ Please enter an Event Name.", "warning");
    return;
  }

  const metadata = { event: eventName, subsection: subSection, category, title };

  if (uploadMode === "link") {
    const url = document.getElementById("upload-url").value.trim();
    if (!url) return showToast("⚠️ Please paste a link.", "warning");
    
    showToast("💾 Saving Link to Master Brain...", "info");
    await saveExternalLink(url, metadata);
    showToast("✅ Link Saved Successfully!", "success");
    document.getElementById("upload-url").value = "";
    document.getElementById("upload-event").value = "";
    document.getElementById("upload-category").value = "";
    document.getElementById("upload-title").value = "";
    
    // Switch to manage media tab automatically
    switchAdminTab('manage', document.querySelector('.admin-tab:nth-child(2)'));
    
  } else {
    if (!state.pendingFiles.length) return showToast("⚠️ Select a file first.", "warning");
    const targetCloud = document.getElementById("upload-cloud-target").value;
    
    const progressEl = document.getElementById("upload-progress");
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    
    if(progressEl) progressEl.style.display = "flex";
    
    for (const file of state.pendingFiles) {
      if(progressText) progressText.textContent = `Uploading ${file.name}...`;
      if(progressFill) progressFill.style.width = `0%`;
      try {
        await uploadMedia(file, metadata, targetCloud);
      } catch (err) {
        console.error("Upload failed:", err);
        showToast(`❌ Upload failed: ${err.message}`, "error");
        if(progressEl) progressEl.style.display = "none";
        return; // Stop further processing
      }
    }
    
    if(progressText) progressText.textContent = "Upload Complete!";
    if(progressFill) progressFill.style.width = `100%`;
    showToast("✅ All files uploaded to Cloud!", "success");
    
    let countdown = 5;
    if(progressText) progressText.textContent = `Upload Complete! Redirecting to Work section in ${countdown}s...`;
    const interval = setInterval(() => {
      countdown--;
      if(progressText) progressText.textContent = `Upload Complete! Redirecting to Work section in ${countdown}s...`;
      if(countdown <= 0) {
        clearInterval(interval);
        window.location.hash = "#work";
        window.location.reload();
      }
    }, 1000);
  }
  
  updateAdminStats();
  renderAdminMediaList();
};

// ── Upload Progress Handler ───────────────────────────────
function handleUploadProgress({ id, percent, status }) {
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressText && status === "uploading") progressText.textContent = `Uploading... ${percent}%`;
}

// ═══════════════════════════════════════════════════════════
// ADMIN — MANAGE MEDIA LIST
// ═══════════════════════════════════════════════════════════
async function renderAdminMediaList() {
  const manageGrid = document.getElementById("manage-grid");
  const recycleGrid = document.getElementById("recycle-grid");
  if (!manageGrid || !recycleGrid) return;
  
  const items = await getAllMedia();
  manageGrid.innerHTML = "";
  recycleGrid.innerHTML = "";

  // Populate datalists for upload
  const events = new Set();
  const subSections = new Set();
  const categories = new Set();
  items.forEach(i => {
    if(i.event) events.add(i.event);
    if(i.subsection) subSections.add(i.subsection);
    if(i.category) categories.add(i.category);
  });
  
  const elEventList = document.getElementById("event-list");
  if(elEventList) elEventList.innerHTML = Array.from(events).map(e => `<option value="${escHtml(e)}">`).join("");
  const elSubList = document.getElementById("subsection-list");
  if(elSubList) elSubList.innerHTML = Array.from(subSections).map(e => `<option value="${escHtml(e)}">`).join("");
  const elCatList = document.getElementById("category-list");
  if(elCatList) elCatList.innerHTML = Array.from(categories).map(e => `<option value="${escHtml(e)}">`).join("");

  if (!items.length) {
    manageGrid.innerHTML = `<div class="gallery-empty"><div class="empty-icon" style="font-size:2rem">📂</div><p>No files uploaded yet.</p></div>`;
    return;
  }

  const sorted = [...items].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  
  sorted.forEach((item) => {
    const el = document.createElement("div");
    el.className = "admin-media-item";
    el.id = `admin-item-${item.id}`;
    const isVideo = item.type && item.type.startsWith("video");
    const sizeStr = item.size ? formatBytes(item.size) : "—";
    const dateStr = item.uploadedAt ? new Date(item.uploadedAt.toMillis ? item.uploadedAt.toMillis() : item.uploadedAt).toLocaleDateString("en-IN") : "";

    let actionBtns = `
      <button class="editor-action-btn editor-edit-btn" title="Edit" onclick="editMediaItem('${item.docId}')">✏️ Edit</button>
      <button class="editor-action-btn editor-delete-btn" title="Delete" onclick="deleteMediaItem('${item.docId}')">🗑️ Delete</button>
    `;
    if (item.deleted) {
      actionBtns = `
        <button class="editor-action-btn editor-restore-btn" title="Restore" onclick="restoreMediaItem('${item.docId}')">♻️ Restore</button>
        <button class="editor-action-btn editor-delete-btn" title="Permanent Delete" onclick="hardDeleteMediaItem('${item.docId}')">❌ Perm Delete</button>
      `;
    }

    el.innerHTML = `
      <div class="admin-media-thumb">
        ${isVideo ? `<video src="${item.url}" muted preload="metadata"></video>` : `<img src="${item.url}" alt="${escHtml(item.title || item.name)}" loading="lazy" />`}
      </div>
      <div class="admin-media-info">
        <div class="admin-media-name">${escHtml(item.title || item.name)}</div>
        <div class="admin-media-meta"><span class="badge badge-${item.category}">${item.category}</span>&nbsp;${sizeStr} · ${dateStr}</div>
      </div>
      <div class="admin-media-actions">${actionBtns}</div>
    `;
    
    if (item.deleted) {
      recycleGrid.appendChild(el);
    } else {
      manageGrid.appendChild(el);
    }
  });
}

window.deleteMediaItem = async function (identifier) {
  const items = await getAllMedia();
  const item = items.find((i) => i.docId === identifier || i.id === identifier);
  if (!item) {
    showToast("⚠️ Item not found", "error");
    return;
  }
  const targetDocId = item.docId;
  if (!confirm(`Move "${item.title || item.name}" to Recycle Bin?`)) return;
  try {
    await softDeleteMedia(targetDocId);
    showToast("🗑️ Moved to Recycle Bin.", "success");
    try { renderAdminMediaList(); } catch(e){}
    try { updateAdminStats(); } catch(e){}
    await loadGallery(state.currentFilter);
    const lb = document.getElementById("lightbox");
    if (lb && lb.classList.contains("open")) {
      closeLightbox();
    }
  } catch (err) {
    showToast(`❌ Delete failed: ${err.message}`, "error");
  }
};

window.restoreMediaItem = async function (docId) {
  try {
    await restoreMedia(docId);
    showToast("♻️ File restored successfully.", "success");
    try { renderAdminMediaList(); } catch(e){}
    try { updateAdminStats(); } catch(e){}
    loadGallery(state.currentFilter);
  } catch (err) {
    showToast(`❌ Restore failed: ${err.message}`, "error");
  }
};

window.hardDeleteMediaItem = async function (docId) {
  if (!confirm("Permanently delete this file? This CANNOT be undone.")) return;
  try {
    await deleteMedia(docId);
    showToast("❌ File permanently deleted.", "success");
    try { renderAdminMediaList(); } catch(e){}
    try { updateAdminStats(); } catch(e){}
  } catch (err) {
    showToast(`❌ Delete failed: ${err.message}`, "error");
  }
};

window.editMediaItem = async function (identifier) {
  const items = await getAllMedia();
  const item = items.find((i) => i.docId === identifier || i.id === identifier);
  if (!item) {
    showToast("⚠️ Item not found", "error");
    return;
  }

  const targetDocId = item.docId;
  const currentTitle = item.title || item.name || "";
  const currentDesc = item.description || "";
  const currentCategory = item.category || item.subsection || "General";

  const newTitle = prompt("Edit Title:", currentTitle);
  if (newTitle === null) return;
  const newDesc = prompt("Edit Subtitle / Description:", currentDesc);
  if (newDesc === null) return;
  const newCat = prompt("Edit Folder / Category (e.g. glimpse, randoms, films):", currentCategory);
  if (newCat === null) return;

  try {
    await updateMedia(targetDocId, { 
      title: newTitle.trim(), 
      description: newDesc.trim(),
      category: newCat.trim().toLowerCase(),
      subsection: newCat.trim().toLowerCase()
    });
    showToast("✅ Item updated!", "success");
    try { renderAdminMediaList(); } catch(e){}
    await loadGallery(state.currentFilter);
    const lb = document.getElementById("lightbox");
    if (lb && lb.classList.contains("open")) {
      renderLightbox();
    }
  } catch (err) {
    showToast(`❌ Update failed: ${err.message}`, "error");
  }
};

window.moveMediaItem = async function (identifier) {
  const items = await getAllMedia();
  const item = items.find((i) => i.docId === identifier || i.id === identifier);
  if (!item) return;

  const targetDocId = item.docId;
  const currentFolder = item.category || item.subsection || "General";
  const newCat = prompt(`Move "${item.title || item.name}" to folder/category:`, currentFolder);
  
  if (!newCat || !newCat.trim()) return;

  try {
    await updateMedia(targetDocId, { 
      category: newCat.trim().toLowerCase(),
      subsection: newCat.trim().toLowerCase()
    });
    showToast(`📁 Moved to "${newCat.trim().toLowerCase()}"!`, "success");
    try { renderAdminMediaList(); } catch(e){}
    await loadGallery(state.currentFilter);
    const lb = document.getElementById("lightbox");
    if (lb && lb.classList.contains("open")) {
      renderLightbox();
    }
  } catch (err) {
    showToast(`❌ Move failed: ${err.message}`, "error");
  }
};

window.copyMediaLink = function(url) {
  if (!url) return;
  navigator.clipboard.writeText(url).then(() => {
    showToast("📋 Direct media link copied!", "success");
  }).catch(() => {
    showToast("❌ Could not copy link", "error");
  });
};

// ═══════════════════════════════════════════════════════════
// CONTACT FORM
// ═══════════════════════════════════════════════════════════
window.submitContactForm = function (e) {
  e.preventDefault();
  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email-input").value.trim();
  const message = document.getElementById("contact-message").value.trim();

  if (!name || !email || !message) {
    showToast("⚠️ Please fill all required fields.", "warning");
    return;
  }

  // Mailto fallback (works without a backend)
  const subject = encodeURIComponent(`Project Inquiry from ${name}`);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nService: ${document.getElementById("contact-service").value}\nBudget: ${document.getElementById("contact-budget").value}\n\n${message}`
  );
  window.open(`mailto:tvcclicks@gmail.com?subject=${subject}&body=${body}`);
  showToast("✅ Message sent! Check your email client.", "success");
  e.target.reset();
};

// ═══════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const lb = document.getElementById("lightbox");
    if (lb && lb.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    }
    if (e.key === "Escape") {
      const ao = document.getElementById("admin-overlay");
      const ap = document.getElementById("admin-panel");
      if (ao) ao.classList.remove("open");
      if (ap) ap.classList.remove("open");
    }
  });
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastSlideOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Make showToast globally available
window.showToast = showToast;

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════
function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Add shake keyframe for login error
const style = document.createElement("style");
style.textContent = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-8px); }
  80% { transform: translateX(8px); }
}`;
document.head.appendChild(style);

// Register progress listener
onProgress(handleUploadProgress);

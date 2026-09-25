/* =========================================================
   data.js — shared between index.html and admin.html
   Holds the default placeholder content, plus the storage
   layer the admin panel writes to and the site reads from.

   IMPORTANT: this site has no backend/server, so "admin"
   changes are saved with localStorage — they live only in
   the browser they were made in, not on a shared server.
   Use Export/Import in the admin panel to move data between
   browsers or keep a backup. See README.txt.
   ========================================================= */

const STORAGE_KEYS = {
  projects: 'madhan_admin_projects',
  videos: 'madhan_admin_videos',
  profile: 'madhan_admin_profile'
};

/* ---- Default placeholder content (used until the admin panel saves real work) ---- */
const defaultProjects = [
  { title: "Project Title 01", category: "posters",  image: "assets/images/project-01.jpg", description: "Add a short description of this poster project here." },
  { title: "Project Title 02", category: "social",   image: "assets/images/project-02.jpg", description: "Add a short description of this social media project here." },
  { title: "Project Title 03", category: "branding", image: "assets/images/project-03.jpg", description: "Add a short description of this branding project here." },
  { title: "Project Title 04", category: "logo",     image: "assets/images/project-04.jpg", description: "Add a short description of this logo project here." },
  { title: "Project Title 05", category: "creative", image: "assets/images/project-05.jpg", description: "Add a short description of this creative project here." },
  { title: "Project Title 06", category: "posters",  image: "assets/images/project-06.jpg", description: "Add a short description of this poster project here." }
];

const defaultVideos = [
  { title: "Video Project 01", category: "Video Editing", video: "assets/videos/video-01.mp4", poster: "assets/images/video-01.jpg", duration: "00:30" },
  { title: "Video Project 02", category: "Video Editing", video: "assets/videos/video-02.mp4", poster: "assets/images/video-02.jpg", duration: "00:45" },
  { title: "Video Project 03", category: "Video Editing", video: "assets/videos/video-03.mp4", poster: "",                            duration: "01:00" }
];

/* ---- Read/write helpers ---- */
function loadProjects(){
  try{
    const raw = localStorage.getItem(STORAGE_KEYS.projects);
    if (raw){
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  }catch(e){}
  return defaultProjects.slice();
}

function loadVideos(){
  try{
    const raw = localStorage.getItem(STORAGE_KEYS.videos);
    if (raw){
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  }catch(e){}
  return defaultVideos.slice();
}

function saveProjects(list){
  localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(list));
}

function saveVideos(list){
  localStorage.setItem(STORAGE_KEYS.videos, JSON.stringify(list));
}

function resetToDefaults(){
  localStorage.removeItem(STORAGE_KEYS.projects);
  localStorage.removeItem(STORAGE_KEYS.videos);
}

function hasCustomContent(){
  return localStorage.getItem(STORAGE_KEYS.projects) !== null ||
         localStorage.getItem(STORAGE_KEYS.videos) !== null;
}

/* ---- Hero profile photo (the "poster" image shown in the home hero) ----
   Saved as a compressed base64 data URL in localStorage, same as
   project thumbnails, so it can be set from the admin panel without
   needing to place a file in assets/images/ by hand. ---- */
function loadProfilePhoto(){
  try{
    return localStorage.getItem(STORAGE_KEYS.profile) || '';
  }catch(e){ return ''; }
}

function saveProfilePhoto(dataUrl){
  localStorage.setItem(STORAGE_KEYS.profile, dataUrl);
}

function clearProfilePhoto(){
  localStorage.removeItem(STORAGE_KEYS.profile);
}

/* ---- Image helper: downscale + compress an uploaded file to a
   reasonably small base64 data URL, so localStorage (a few MB
   limit) doesn't fill up after a handful of uploads. ---- */
function fileToCompressedDataURL(file, maxWidth = 1400, quality = 0.82){
  return new Promise((resolve, reject) => {
    if (!file) { resolve(''); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read image'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Rough estimate of how much localStorage is currently used by
   our two keys, in KB — shown in the admin panel as a sanity check. */
function estimateStorageKB(){
  const p = localStorage.getItem(STORAGE_KEYS.projects) || '';
  const v = localStorage.getItem(STORAGE_KEYS.videos) || '';
  const ph = localStorage.getItem(STORAGE_KEYS.profile) || '';
  return Math.round((p.length + v.length + ph.length) / 1024);
}

/* ---- Video file storage (IndexedDB) ----
   localStorage has only a few MB of space total, which is fine for
   text and compressed thumbnail images but nowhere near enough for
   real video files. So actual uploaded video files are kept in
   IndexedDB instead (browsers give it far more room — commonly
   hundreds of MB or more, though the exact limit depends on the
   device and free disk space).

   A video item's `video` field is either:
   - a plain path/URL, e.g. "assets/videos/video-05.mp4" (typed in
     manually, or left over from older exports), or
   - "idb:<key>" — meaning the actual file lives in IndexedDB under
     that key, and was added via the "Choose File" upload.
   ---- */
const VIDEO_DB_NAME = 'madhan_portfolio_media';
const VIDEO_DB_STORE = 'videos';
const VIDEO_DB_VERSION = 1;

function isIdbVideoRef(video){
  return typeof video === 'string' && video.startsWith('idb:');
}

function makeIdbVideoKey(){
  return 'idb:' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

function openVideoDB(){
  return new Promise((resolve, reject) => {
    if (!window.indexedDB){ reject(new Error('IndexedDB is not available in this browser.')); return; }
    const req = indexedDB.open(VIDEO_DB_NAME, VIDEO_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VIDEO_DB_STORE)) db.createObjectStore(VIDEO_DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Could not open video storage.'));
  });
}

async function saveVideoFile(file){
  const key = makeIdbVideoKey();
  const db = await openVideoDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_DB_STORE, 'readwrite');
    tx.objectStore(VIDEO_DB_STORE).put({ blob: file, name: file.name, type: file.type }, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Could not save the video file.'));
  });
  return key;
}

async function getVideoFile(key){
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_DB_STORE, 'readonly');
    const req = tx.objectStore(VIDEO_DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Could not read the video file.'));
  });
}

async function deleteVideoFile(key){
  try{
    const db = await openVideoDB();
    await new Promise((resolve) => {
      const tx = db.transaction(VIDEO_DB_STORE, 'readwrite');
      tx.objectStore(VIDEO_DB_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }catch(e){ /* best-effort cleanup */ }
}

/* Resolves a video item's `video` field into something a <video>
   tag can actually play: an IndexedDB-stored file becomes a
   temporary blob: object URL, a plain path/URL is returned as-is.
   Call revokeResolvedVideoUrl() when done playing to free memory. */
let _lastVideoObjectUrl = null;
async function resolveVideoSrc(video){
  if (!isIdbVideoRef(video)) return video || '';
  const record = await getVideoFile(video);
  if (!record || !record.blob) return '';
  revokeResolvedVideoUrl();
  _lastVideoObjectUrl = URL.createObjectURL(record.blob);
  return _lastVideoObjectUrl;
}
function revokeResolvedVideoUrl(){
  if (_lastVideoObjectUrl){
    URL.revokeObjectURL(_lastVideoObjectUrl);
    _lastVideoObjectUrl = null;
  }
}

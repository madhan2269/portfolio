/* =========================================================
   admin.js — logic for admin.html
   Uses the shared arrays/helpers from js/data.js.

   SECURITY NOTE: the passcode gate below is a convenience
   deterrent only, not real protection — anyone who can view
   this file's source can read ADMIN_PASSCODE. This is a static,
   no-backend site, so real authentication isn't possible without
   adding a server. Don't use this panel to guard anything
   sensitive. Change the passcode by editing the line below.
   ========================================================= */
const ADMIN_PASSCODE = 'madhan2026';

let workItems = [];
let videoItems = [];

document.addEventListener('DOMContentLoaded', () => {
  initGate();
  initTabs();
  initWorkForm();
  initVideoForm();
  initProfileForm();
  initToolbar();
  wireFileDrop('workImageDropZone', 'workImageFile', 'workImageMeta');
  wireFileDrop('videoDropZone', 'videoFile', 'videoFileMeta');
  wireFileDrop('videoPosterDropZone', 'videoPosterFile', 'videoPosterMeta');
  wireFileDrop('profileImageDropZone', 'profileImageFile', 'profileImageMeta');
});

/* ---------- Reusable drag-and-drop wiring for the <input type="file">
   pickers in the forms below. Clicking/dragging onto the box behaves
   the same as clicking the (invisible, but still real) file input. ---- */
function wireFileDrop(zoneId, inputId, metaId){
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const meta = document.getElementById(metaId);
  if (!zone || !input || !meta) return;

  const defaultMeta = meta.textContent;

  const showFile = (file) => {
    if (file){
      meta.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
      zone.classList.add('has-file');
    } else {
      meta.textContent = defaultMeta;
      zone.classList.remove('has-file');
    }
  };

  input.addEventListener('change', () => showFile(input.files[0] || null));

  ['dragenter', 'dragover'].forEach(evt => {
    zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add('is-dragover'); });
  });
  ['dragleave', 'dragend'].forEach(evt => {
    zone.addEventListener(evt, () => zone.classList.remove('is-dragover'));
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('is-dragover');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    input.files = e.dataTransfer.files;
    showFile(file);
  });

  // Exposed so editVideoItem()/editWorkItem() can reset or pre-fill the label.
  zone._setMeta = (text) => {
    meta.textContent = text || defaultMeta;
    zone.classList.toggle('has-file', !!text);
  };
  zone._reset = () => showFile(null);
}

/* ---------- Passcode gate ---------- */
function initGate(){
  const gate = document.getElementById('gate');
  const app = document.getElementById('adminApp');
  const form = document.getElementById('gateForm');
  const input = document.getElementById('gatePasscode');
  const error = document.getElementById('gateError');

  const unlock = () => {
    gate.classList.add('is-unlocked');
    app.hidden = false;
    renderWorkList();
    renderVideoList();
    renderProfilePreview();
    updateStorageUsage();
  };

  if (sessionStorage.getItem('madhan_admin_unlocked') === 'true'){
    unlock();
    return;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value === ADMIN_PASSCODE){
      sessionStorage.setItem('madhan_admin_unlocked', 'true');
      error.hidden = true;
      unlock();
    } else {
      error.hidden = false;
      input.value = '';
      input.focus();
    }
  });
}

/* ---------- Tabs ---------- */
function initTabs(){
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('is-active'));
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('is-active');
    });
  });
}

/* ---------- WORK: form + list ---------- */
function initWorkForm(){
  workItems = loadProjects();
  const form = document.getElementById('workForm');
  const editIndex = document.getElementById('workEditIndex');
  const cancelBtn = document.getElementById('workCancelEdit');
  const submitBtn = document.getElementById('workSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('workTitle').value.trim();
    const category = document.getElementById('workCategory').value;
    const desc = document.getElementById('workDesc').value.trim();
    const pathInput = document.getElementById('workImagePath').value.trim();
    const fileInput = document.getElementById('workImageFile');
    const idx = editIndex.value;
    const existing = idx !== '' ? workItems[parseInt(idx, 10)] : null;

    // Keep the existing image unless a new file or path was given.
    let image = existing ? (existing.image || '') : '';
    if (fileInput.files[0]){
      try{
        image = await fileToCompressedDataURL(fileInput.files[0]);
      }catch(err){
        showToast('Could not read that image file.');
        return;
      }
    } else if (pathInput){
      image = pathInput;
    }

    const item = { title, category, image: image || '', description: desc };

    if (idx !== ''){
      workItems[parseInt(idx, 10)] = item;
      showToast('Work item updated.');
    } else {
      workItems.push(item);
      showToast('Work item added.');
    }

    saveProjects(workItems);
    resetWorkForm();
    renderWorkList();
    updateStorageUsage();
  });

  cancelBtn.addEventListener('click', resetWorkForm);

  function resetWorkForm(){
    form.reset();
    document.getElementById('workCategory').value = 'posters';
    editIndex.value = '';
    document.getElementById('workFormTitle').textContent = 'Add a new work item';
    submitBtn.innerHTML = 'Add Work <span aria-hidden="true">→</span>';
    cancelBtn.hidden = true;
    const zone = document.getElementById('workImageDropZone');
    if (zone && zone._reset) zone._reset();
  }
}

function renderWorkList(){
  const list = document.getElementById('workList');
  if (workItems.length === 0){
    list.innerHTML = '<p class="admin-empty">No work items yet — add your first one above.</p>';
    return;
  }

  list.innerHTML = workItems.map((p, i) => `
    <div class="admin-item">
      ${p.image
        ? `<img class="admin-item__thumb" src="${p.image}" alt="" onerror="this.outerHTML='<span class=&quot;admin-item__thumb admin-item__thumb--empty&quot;>No image</span>';">`
        : `<span class="admin-item__thumb admin-item__thumb--empty">No image</span>`}
      <div class="admin-item__body">
        <div class="admin-item__title">${escapeHtml(p.title)}</div>
        <div class="admin-item__meta">${escapeHtml(p.category)}</div>
      </div>
      <div class="admin-item__actions">
        <button type="button" data-edit="${i}">Edit</button>
        <button type="button" class="is-danger" data-delete="${i}">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editWorkItem(parseInt(btn.dataset.edit, 10))));
  list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteWorkItem(parseInt(btn.dataset.delete, 10))));
}

function editWorkItem(i){
  const item = workItems[i];
  document.getElementById('workTitle').value = item.title;
  document.getElementById('workCategory').value = item.category;
  document.getElementById('workDesc').value = item.description || '';
  document.getElementById('workImagePath').value = item.image && item.image.startsWith('data:') ? '' : (item.image || '');
  document.getElementById('workImageFile').value = '';
  const workZone = document.getElementById('workImageDropZone');
  if (workZone && workZone._reset) workZone._reset();
  document.getElementById('workEditIndex').value = i;
  document.getElementById('workFormTitle').textContent = 'Edit work item';
  document.getElementById('workSubmitBtn').innerHTML = 'Save Changes <span aria-hidden="true">→</span>';
  document.getElementById('workCancelEdit').hidden = false;
  document.getElementById('workForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteWorkItem(i){
  if (!confirm('Delete this work item?')) return;
  workItems.splice(i, 1);
  saveProjects(workItems);
  renderWorkList();
  updateStorageUsage();
  showToast('Work item deleted.');
}

/* ---------- VIDEOS: form + list ---------- */
function initVideoForm(){
  videoItems = loadVideos();
  const form = document.getElementById('videoForm');
  const editIndex = document.getElementById('videoEditIndex');
  const cancelBtn = document.getElementById('videoCancelEdit');
  const submitBtn = document.getElementById('videoSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('videoTitle').value.trim();
    const category = document.getElementById('videoCategory').value.trim() || 'Video Editing';
    const pathInput = document.getElementById('videoPath').value.trim();
    const videoFileInput = document.getElementById('videoFile');
    const duration = document.getElementById('videoDuration').value.trim();
    const posterPathInput = document.getElementById('videoPosterPath').value.trim();
    const posterFileInput = document.getElementById('videoPosterFile');

    const idx = editIndex.value;
    const existing = idx !== '' ? videoItems[parseInt(idx, 10)] : null;

    // Start from whatever this item already had (when editing), then let
    // a newly chosen file or a newly typed path override it.
    let video = existing ? existing.video : '';
    let videoName = existing ? (existing.videoName || '') : '';
    let oldVideoKeyToDelete = null;

    if (videoFileInput.files[0]){
      const file = videoFileInput.files[0];
      const previousLabel = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Saving video…';
      try{
        const key = await saveVideoFile(file);
        if (existing && isIdbVideoRef(existing.video)) oldVideoKeyToDelete = existing.video;
        video = key;
        videoName = file.name;
      }catch(err){
        showToast("Could not save that video — it may be too large for this browser's storage. Try a smaller/shorter file, or use the path field instead.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = previousLabel;
        return;
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = previousLabel;
    } else if (pathInput){
      video = pathInput;
      videoName = '';
    }

    if (!video){
      showToast('Choose a video file, or paste a video path.');
      return;
    }

    let poster = existing ? (existing.poster || '') : '';
    if (posterFileInput.files[0]){
      try{
        poster = await fileToCompressedDataURL(posterFileInput.files[0], 900, 0.8);
      }catch(err){
        showToast('Could not read that thumbnail image.');
        return;
      }
    } else if (posterPathInput){
      poster = posterPathInput;
    }

    const item = { title, category, video, videoName, poster: poster || '', duration };

    if (idx !== ''){
      videoItems[parseInt(idx, 10)] = item;
      showToast('Video updated.');
    } else {
      videoItems.push(item);
      showToast('Video added.');
    }

    saveVideos(videoItems);
    if (oldVideoKeyToDelete) deleteVideoFile(oldVideoKeyToDelete);
    resetVideoForm();
    renderVideoList();
    updateStorageUsage();
  });

  cancelBtn.addEventListener('click', resetVideoForm);

  function resetVideoForm(){
    form.reset();
    document.getElementById('videoCategory').value = 'Video Editing';
    editIndex.value = '';
    document.getElementById('videoFormTitle').textContent = 'Add a new video';
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Add Video <span aria-hidden="true">→</span>';
    cancelBtn.hidden = true;
    const videoZone = document.getElementById('videoDropZone');
    if (videoZone && videoZone._reset) videoZone._reset();
    const posterZone = document.getElementById('videoPosterDropZone');
    if (posterZone && posterZone._reset) posterZone._reset();
  }
}

function renderVideoList(){
  const list = document.getElementById('videoList');
  if (videoItems.length === 0){
    list.innerHTML = '<p class="admin-empty">No videos yet — add your first one above.</p>';
    return;
  }

  list.innerHTML = videoItems.map((v, i) => {
    const location = isIdbVideoRef(v.video)
      ? `📁 Uploaded: ${escapeHtml(v.videoName || 'video file')}`
      : escapeHtml(v.video);
    return `
    <div class="admin-item">
      ${v.poster
        ? `<img class="admin-item__thumb" src="${v.poster}" alt="" onerror="this.outerHTML='<span class=&quot;admin-item__thumb admin-item__thumb--empty&quot;>No thumb</span>';">`
        : `<span class="admin-item__thumb admin-item__thumb--empty">No thumb</span>`}
      <div class="admin-item__body">
        <div class="admin-item__title">${escapeHtml(v.title)}</div>
        <div class="admin-item__meta">${location}${v.duration ? ' · ' + escapeHtml(v.duration) : ''}</div>
      </div>
      <div class="admin-item__actions">
        <button type="button" data-edit="${i}">Edit</button>
        <button type="button" class="is-danger" data-delete="${i}">Delete</button>
      </div>
    </div>
  `;}).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editVideoItem(parseInt(btn.dataset.edit, 10))));
  list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteVideoItem(parseInt(btn.dataset.delete, 10))));
}

function editVideoItem(i){
  const item = videoItems[i];
  document.getElementById('videoTitle').value = item.title;
  document.getElementById('videoCategory').value = item.category || 'Video Editing';
  document.getElementById('videoDuration').value = item.duration || '';
  document.getElementById('videoFile').value = '';
  document.getElementById('videoPosterPath').value = item.poster && item.poster.startsWith('data:') ? '' : (item.poster || '');
  document.getElementById('videoPosterFile').value = '';

  const videoZone = document.getElementById('videoDropZone');
  if (isIdbVideoRef(item.video)){
    document.getElementById('videoPath').value = '';
    if (videoZone && videoZone._setMeta) videoZone._setMeta(`Current: ${item.videoName || 'uploaded video'} — choose a new file to replace it`);
  } else {
    document.getElementById('videoPath').value = item.video || '';
    if (videoZone && videoZone._reset) videoZone._reset();
  }
  const posterZone = document.getElementById('videoPosterDropZone');
  if (posterZone && item.poster && item.poster.startsWith('data:')){
    if (posterZone._setMeta) posterZone._setMeta('Current thumbnail set — choose a new file to replace it');
  } else if (posterZone && posterZone._reset){
    posterZone._reset();
  }

  document.getElementById('videoEditIndex').value = i;
  document.getElementById('videoFormTitle').textContent = 'Edit video';
  document.getElementById('videoSubmitBtn').innerHTML = 'Save Changes <span aria-hidden="true">→</span>';
  document.getElementById('videoCancelEdit').hidden = false;
  document.getElementById('videoForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteVideoItem(i){
  if (!confirm('Delete this video?')) return;
  const [removed] = videoItems.splice(i, 1);
  saveVideos(videoItems);
  if (removed && isIdbVideoRef(removed.video)) deleteVideoFile(removed.video);
  renderVideoList();
  updateStorageUsage();
  showToast('Video deleted.');
}

/* ---------- PROFILE PHOTO: form + preview ---------- */
function initProfileForm(){
  const form = document.getElementById('profileForm');
  const removeBtn = document.getElementById('profileRemoveBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('profileImageFile');
    const file = fileInput.files[0];
    if (!file){
      showToast('Choose a photo first.');
      return;
    }
    try{
      const dataUrl = await fileToCompressedDataURL(file, 900, 0.85);
      saveProfilePhoto(dataUrl);
      renderProfilePreview();
      updateStorageUsage();
      form.reset();
      const zone = document.getElementById('profileImageDropZone');
      if (zone && zone._reset) zone._reset();
      showToast('Photo saved — it now shows on the home page.');
    }catch(err){
      showToast('Could not read that image file.');
    }
  });

  removeBtn.addEventListener('click', () => {
    if (!loadProfilePhoto()) { showToast('No photo saved yet.'); return; }
    if (!confirm('Remove the home page photo? The "EM" monogram will show instead.')) return;
    clearProfilePhoto();
    renderProfilePreview();
    updateStorageUsage();
    showToast('Photo removed.');
  });
}

function renderProfilePreview(){
  const row = document.getElementById('profilePreviewRow');
  const img = document.getElementById('profilePreviewImg');
  if (!row || !img) return;
  const saved = loadProfilePhoto();
  if (saved){
    img.src = saved;
    row.hidden = false;
  } else {
    img.src = '';
    row.hidden = true;
  }
}

/* ---------- Export / Import / Reset ---------- */
function initToolbar(){
  document.getElementById('exportBtn').addEventListener('click', () => {
    const payload = { projects: workItems, videos: videoItems, profilePhoto: loadProfilePhoto(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'madhan-portfolio-data.json';
    a.click();
    URL.revokeObjectURL(url);

    if (videoItems.some(v => isIdbVideoRef(v.video))){
      showToast("Exported — note: uploaded video files stay in this browser only, keep your original .mp4 files as backup too.");
    }
  });

  document.getElementById('importInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        if (Array.isArray(data.projects)) { workItems = data.projects; saveProjects(workItems); }
        if (Array.isArray(data.videos)) { videoItems = data.videos; saveVideos(videoItems); }
        if (typeof data.profilePhoto === 'string' && data.profilePhoto) { saveProfilePhoto(data.profilePhoto); }
        renderWorkList();
        renderVideoList();
        renderProfilePreview();
        updateStorageUsage();
        showToast('Data imported.');
      }catch(err){
        showToast('That file could not be read as valid export data.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset to the original placeholder work and videos? This clears everything added here.')) return;
    videoItems.filter(v => isIdbVideoRef(v.video)).forEach(v => deleteVideoFile(v.video));
    resetToDefaults();
    workItems = loadProjects();
    videoItems = loadVideos();
    renderWorkList();
    renderVideoList();
    updateStorageUsage();
    showToast('Reset to defaults.');
  });
}

function updateStorageUsage(){
  const el = document.getElementById('storageUsage');
  if (el) el.textContent = `Currently using about ${estimateStorageKB()} KB of this browser's storage.`;
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(message){
  let toast = document.querySelector('.toast');
  if (!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

/* ---------- helpers ---------- */
function escapeHtml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

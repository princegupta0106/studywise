// popup.js
const downloadBtn = document.getElementById('downloadBtn');
const folderNameInput = document.getElementById('folderName');
const linksDiv = document.getElementById('links');
const status = document.getElementById('status');

let currentLinks = [];

function setStatus(text) { status.textContent = text; }

// Auto-collect links when popup opens
async function autoCollectLinks() {
  setStatus('Collecting links...');
  linksDiv.innerHTML = '';
  downloadBtn.disabled = true;

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || tabs.length === 0) {
    setStatus('No active tab found');
    return;
  }
  const tab = tabs[0];
  chrome.tabs.sendMessage(tab.id, { type: 'collectLinks' }, (resp) => {
    if (!resp) {
      setStatus('No response from page. Make sure the extension is allowed to run on this site.');
      return;
    }
    if (!resp.ok) {
      setStatus('Error collecting links: ' + resp.error);
      return;
    }
    currentLinks = resp.links || [];
    if (currentLinks.length === 0) {
      setStatus('No links found inside ResourceList ULs on this page.');
      return;
    }
    setStatus(`${currentLinks.length} links collected. Enter folder name and click download.`);
    downloadBtn.disabled = false;
    // render list
    currentLinks.forEach((l, i) => {
      const div = document.createElement('div');
      div.className = 'link-item';
      div.innerHTML = `<span class="filename">${escapeHtml(l.filename)}</span> <span class="small">— ${escapeHtml(l.href)}</span>`;
      linksDiv.appendChild(div);
    });
  });
}

downloadBtn.addEventListener('click', async () => {
  if (!currentLinks || currentLinks.length === 0) return;
  
  const folderName = folderNameInput.value.trim() || 'downloads';
  const sanitizedFolder = sanitizeFilename(folderName);
  
  downloadBtn.disabled = true;
  setStatus('Starting downloads...');
  let success = 0;
  for (const l of currentLinks) {
    try {
      await chrome.downloads.download({
        url: l.href,
        filename: `${sanitizedFolder}/${sanitizeFilename(l.filename)}`,
        conflictAction: 'uniquify',
        saveAs: false
      });
      success++;
    } catch (e) {
      console.warn('download failed', e, l);
    }
  }
  setStatus(`Requested ${success}/${currentLinks.length} downloads to folder "${sanitizedFolder}". Check Chrome's Downloads.`);
});

// Auto-collect when popup loads
document.addEventListener('DOMContentLoaded', autoCollectLinks);

function sanitizeFilename(name) {
  // keep it simple: remove slashes and line breaks
  return name.replace(/[\\/\n\r]+/g, '_');
}

function escapeHtml(s) {
  return (s + '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

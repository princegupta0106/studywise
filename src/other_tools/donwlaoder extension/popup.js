// popup.js - Simple Folder Clicker
const clickAllBtn = document.getElementById('clickAllBtn');
const highlightBtn = document.getElementById('highlightBtn');
const status = document.getElementById('status');
const progress = document.getElementById('progress');

let availableFolders = [];

function setStatus(text) { 
  status.textContent = text; 
  console.log(text);
}

function updateProgress(text) {
  progress.innerHTML = text;
}

// Check for available folders
async function checkForFolders() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      setStatus('No active tab found');
      return;
    }
    
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, { type: 'getFolders' }, (resp) => {
      if (chrome.runtime.lastError) {
        setStatus('Extension not ready. Please refresh the page.');
        return;
      }
      if (resp && resp.ok && resp.folders && resp.folders.length > 0) {
        availableFolders = resp.folders;
        clickAllBtn.disabled = false;
        setStatus(`Ready! Found ${resp.folders.length} folders to click: ${resp.folders.join(', ')}`);
        
        // Show folder preview
        updateProgress(`
          <div style="font-weight: bold; margin-bottom: 8px;">📂 Found ${resp.folders.length} folders:</div>
          ${resp.folders.map((folder, index) => 
            `<div class="folder-item" id="folder-${index}">
              ${index + 1}. ${folder}
            </div>`
          ).join('')}
        `);
      } else {
        setStatus('No folders found on this page');
        updateProgress('');
      }
    });
  } catch (error) {
    setStatus('Error: ' + error.message);
  }
}

// Highlight folders for preview
async function highlightFolders() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;
    
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, { type: 'highlightFolders' }, (resp) => {
      if (resp && resp.ok) {
        setStatus(`✨ ${resp.message} highlighted on the page!`);
      } else {
        setStatus('Failed to highlight folders');
      }
    });
  } catch (error) {
    setStatus('Error highlighting folders: ' + error.message);
  }
}

// Click all folders sequentially
async function clickAllFolders() {
  if (availableFolders.length === 0) {
    setStatus('No folders found. Please refresh and try again.');
    return;
  }
  
  setStatus('🚀 Starting to click all folders...');
  clickAllBtn.disabled = true;
  highlightBtn.disabled = true;
  
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      setStatus('No active tab found');
      clickAllBtn.disabled = false;
      highlightBtn.disabled = false;
      return;
    }
    
    const tab = tabs[0];
    
    // Listen for click progress messages
    const messageListener = (message, sender, sendResponse) => {
      if (message.type === 'folderClicked') {
        const { folderName, folderIndex, totalFolders, isLast } = message;
        
        setStatus(`🖱️ Clicked ${folderIndex}/${totalFolders}: ${folderName}`);
        
        // Update visual progress
        const folderElement = document.getElementById(`folder-${folderIndex - 1}`);
        if (folderElement) {
          folderElement.classList.add('clicked');
          folderElement.innerHTML = `✅ ${folderIndex}. ${folderName}`;
        }
        
        if (isLast) {
          chrome.runtime.onMessage.removeListener(messageListener);
          setStatus(`🎉 Completed! Clicked all ${totalFolders} folders successfully.`);
          clickAllBtn.disabled = false;
          highlightBtn.disabled = false;
        }
      }
    };
    
    // Add message listener
    chrome.runtime.onMessage.addListener(messageListener);
    
    // Start clicking process
    chrome.tabs.sendMessage(tab.id, { type: 'clickAllFolders' }, (resp) => {
      if (chrome.runtime.lastError) {
        setStatus('Error: Please refresh the page and try again.');
        clickAllBtn.disabled = false;
        highlightBtn.disabled = false;
        chrome.runtime.onMessage.removeListener(messageListener);
        return;
      }
      if (!resp || !resp.ok) {
        setStatus('Error starting click process: ' + (resp ? resp.error : 'No response'));
        clickAllBtn.disabled = false;
        highlightBtn.disabled = false;
        chrome.runtime.onMessage.removeListener(messageListener);
        return;
      }
      
      setStatus('⏳ Clicking folders in progress...');
    });
    
  } catch (error) {
    setStatus('Error: ' + error.message);
    clickAllBtn.disabled = false;
    highlightBtn.disabled = false;
  }
}

// Event listeners
clickAllBtn.addEventListener('click', clickAllFolders);
highlightBtn.addEventListener('click', highlightFolders);

// Auto-check for folders when popup loads
document.addEventListener('DOMContentLoaded', checkForFolders);

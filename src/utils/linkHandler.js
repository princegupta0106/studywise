// Safe link opening utility that handles popup blockers gracefully

export function safeOpenLink(url, options = {}) {
  const {
    fallbackMessage = "If the link doesn't open, click here to access it manually:",
    showFallback = true,
    target = '_blank',
    timeout = 1000
  } = options

  // First, try to open in new window/tab
  try {
    const newWindow = window.open(url, target, 'noopener,noreferrer')
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup was blocked, show fallback
      if (showFallback) {
        showPopupBlockedFallback(url, fallbackMessage)
      }
      return false
    }

    // Check after a short delay if window is still open
    setTimeout(() => {
      try {
        if (newWindow.closed) {
          // Window was closed, might have been blocked
          if (showFallback) {
            showPopupBlockedFallback(url, fallbackMessage)
          }
        }
      } catch (e) {
        // Cross-origin restriction, assume it opened successfully
        console.log('Link opened successfully (cross-origin)')
      }
    }, timeout)

    return true
  } catch (error) {
    console.error('Error opening link:', error)
    if (showFallback) {
      showPopupBlockedFallback(url, fallbackMessage)
    }
    return false
  }
}

function showPopupBlockedFallback(url, message) {
  // Create a modal overlay
  const overlay = document.createElement('div')
  overlay.className = 'popup-blocked-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
  `

  // Create modal content
  const modal = document.createElement('div')
  modal.style.cssText = `
    background: #1a1a2e;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  `

  modal.innerHTML = `
    <div style="text-align: center; color: white;">
      <div style="font-size: 24px; margin-bottom: 16px;">🚫</div>
      <h3 style="margin: 0 0 16px 0; color: #ffdd44; font-size: 18px; font-weight: 600;">
        Popup Blocked
      </h3>
      <p style="margin: 0 0 20px 0; color: #ccc; line-height: 1.5;">
        ${message}
      </p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a 
          href="${url}" 
          target="_blank" 
          rel="noopener noreferrer"
          style="
            background: #ffdd44;
            color: #1a1a2e;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#e6c639'"
          onmouseout="this.style.background='#ffdd44'"
        >
          Open Link
        </a>
        <button 
          onclick="this.closest('.popup-blocked-overlay').remove()"
          style="
            background: transparent;
            color: #ccc;
            border: 1px solid #555;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          "
          onmouseover="this.style.borderColor='#777'; this.style.color='white'"
          onmouseout="this.style.borderColor='#555'; this.style.color='#ccc'"
        >
          Cancel
        </button>
      </div>
      <div style="margin-top: 16px; font-size: 12px; color: #888;">
        <p style="margin: 0;">💡 Tip: You can allow popups for this site in your browser settings</p>
      </div>
    </div>
  `

  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove()
    }
  })

  // Close on Escape key
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      overlay.remove()
      document.removeEventListener('keydown', handleKeydown)
    }
  }
  document.addEventListener('keydown', handleKeydown)

  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      overlay.remove()
    }
  }, 30000)
}

// Alternative method using location.href as fallback
export function safeNavigate(url, options = {}) {
  const { useLocationFallback = true, delay = 100 } = options
  
  const success = safeOpenLink(url, { ...options, showFallback: false })
  
  if (!success && useLocationFallback) {
    // If popup fails, offer to navigate in current tab after a delay
    setTimeout(() => {
      const confirmNavigate = confirm(
        `The link couldn't open in a new tab. Would you like to open it in this tab instead?\n\nURL: ${url}`
      )
      if (confirmNavigate) {
        window.location.href = url
      }
    }, delay)
  }
  
  return success
}

// Copy URL to clipboard as fallback
export async function copyUrlToClipboard(url, showMessage = true) {
  try {
    await navigator.clipboard.writeText(url)
    if (showMessage) {
      showToast('Link copied to clipboard!', 'success')
    }
    return true
  } catch (error) {
    console.error('Failed to copy URL:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      if (showMessage) {
        showToast('Link copied to clipboard!', 'success')
      }
      return true
    } catch (fallbackError) {
      document.body.removeChild(textArea)
      if (showMessage) {
        showToast('Failed to copy link', 'error')
      }
      return false
    }
  }
}

// Simple toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    z-index: 10001;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  `
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.remove()
    }
  }, 3000)
}

// Enhanced link handler with multiple fallback options
export function createLinkHandler(url, options = {}) {
  return {
    // Primary method - try to open in new tab
    open: () => safeOpenLink(url, options),
    
    // Navigate in same tab
    navigate: () => {
      window.location.href = url
    },
    
    // Copy to clipboard
    copy: () => copyUrlToClipboard(url),
    
    // Show options modal
    showOptions: () => {
      showLinkOptionsModal(url)
    }
  }
}

function showLinkOptionsModal(url) {
  const overlay = document.createElement('div')
  overlay.className = 'link-options-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
  `

  const modal = document.createElement('div')
  modal.style.cssText = `
    background: #1a1a2e;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  `

  const shortUrl = url.length > 50 ? url.substring(0, 47) + '...' : url

  modal.innerHTML = `
    <div style="color: white;">
      <h3 style="margin: 0 0 16px 0; color: #ffdd44; font-size: 18px; font-weight: 600;">
        Open Link
      </h3>
      <p style="margin: 0 0 8px 0; color: #ccc; font-size: 14px;">URL:</p>
      <div style="background: #2a2a3e; padding: 8px 12px; border-radius: 4px; margin-bottom: 20px; font-family: monospace; font-size: 12px; color: #aaa; word-break: break-all;">
        ${url}
      </div>
      <div style="display: grid; gap: 12px;">
        <button 
          onclick="window.open('${url}', '_blank', 'noopener,noreferrer'); this.closest('.link-options-overlay').remove()"
          style="
            background: #ffdd44;
            color: #1a1a2e;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          "
        >
          🌐 Open in New Tab
        </button>
        <button 
          onclick="window.location.href='${url}'"
          style="
            background: #3b82f6;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          "
        >
          ➡️ Open in Current Tab
        </button>
        <button 
          onclick="navigator.clipboard.writeText('${url}').then(() => alert('Link copied!')); this.closest('.link-options-overlay').remove()"
          style="
            background: #10b981;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          "
        >
          📋 Copy Link
        </button>
        <button 
          onclick="this.closest('.link-options-overlay').remove()"
          style="
            background: transparent;
            color: #ccc;
            border: 1px solid #555;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          "
        >
          Cancel
        </button>
      </div>
    </div>
  `

  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove()
    }
  })
}
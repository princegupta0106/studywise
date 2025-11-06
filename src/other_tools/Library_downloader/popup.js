const extractBtn = document.getElementById('extractBtn')
const downloadBtn = document.getElementById('downloadAll')
const copyBtn = document.getElementById('copyBtn')
const outputEl = document.getElementById('output')
const statusEl = document.getElementById('status')
const folderInput = document.getElementById('folder')

function sanitizeName(name){
  return name ? name.replace(/[<>:"\/\\|?*\x00-\x1F]/g,'').trim() : 'file'
}

async function runExtractorOnPage(tabId){
  // function runs inside page context
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const BASE = location.origin
      function cleanName(text){
        if(!text) return ''
        return text.replace(/\s+/g,' ').replace(/<!--.*?-->/g,'').trim()
      }
      function makeAbsolute(url){
        if(!url) return ''
        try{
          return new URL(url, location.href).href
        }catch(e){
          return (BASE.replace(/\/+$/,'') + '/' + url.replace(/^\/+/,''))
        }
      }
      // select anchors that likely point to pdfs or have the structure used by library
      const anchors = Array.from(document.querySelectorAll('a[href]'))
      const items = anchors.map(a => {
        const bold = a.querySelector('.font-bold')
        const name = cleanName(bold ? bold.textContent : a.textContent)
        const href = a.getAttribute('href')
        const url = makeAbsolute(href)
        return { name, url }
      }).filter(x => x.url && x.url.toLowerCase().includes('.pdf'))
      return items
    }
  })
  return results?.[0]?.result || []
}

extractBtn.addEventListener('click', async () => {
  statusEl.textContent = 'Extracting...'
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) { statusEl.textContent = 'No active tab.'; return }
    const items = await runExtractorOnPage(tab.id)
    if (!items.length) {
      outputEl.value = '[]'
      statusEl.textContent = 'No PDF links found on the page.'
      return
    }
    outputEl.value = JSON.stringify(items, null, 2)
    statusEl.textContent = `Found ${items.length} PDF(s).`
  } catch (err) {
    console.error(err)
    statusEl.textContent = 'Extraction failed.'
  }
})

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputEl.value)
    statusEl.textContent = 'JSON copied to clipboard.'
  } catch (e) {
    statusEl.textContent = 'Copy failed.'
  }
})

downloadBtn.addEventListener('click', async () => {
  statusEl.textContent = 'Preparing downloads...'
  let items
  try {
    items = JSON.parse(outputEl.value)
    if (!Array.isArray(items)) throw new Error('Invalid JSON')
  } catch (e) {
    statusEl.textContent = 'No valid JSON to download. Click Extract first.'
    return
  }
  if (!items.length) { statusEl.textContent = 'No files to download.'; return }

  const folder = sanitizeName(folderInput.value || 'bits_library')
  let started = 0
  for (const it of items) {
    try {
      const url = it.url
      const urlObj = new URL(url)
      const urlName = decodeURIComponent((urlObj.pathname.split('/').pop() || 'file.pdf'))
      const baseName = sanitizeName((it.name || urlName).replace(/\s+/g,' '))
      const filename = `${folder}/${baseName}-${Math.random().toString(36).slice(2,8)}-${urlName}`
      await chrome.downloads.download({
        url,
        filename,
        conflictAction: 'uniquify',
        saveAs: false
      })
      started++
    } catch (err) {
      console.error('download error', err, it.url)
    }
  }
  statusEl.textContent = `Started ${started}/${items.length} downloads. Check browser downloads.`
})

// auto-run extraction when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  // call the same extraction handler you use for extractBtn
  extractBtn.click()
})
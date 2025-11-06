function sanitizeName(name){
  return (name || 'file').replace(/[<>:"\/\\|?*\x00-\x1F]/g,'').replace(/\s+/g,' ').trim() || 'file'
}

async function extractFromPage(tabId){
  const res = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const clean = s => (s||'').replace(/\s+/g,' ').trim()
      const base = location.href
      const anchors = Array.from(document.querySelectorAll('a[href]'))
      const items = anchors.map(a=>{
        const bold = a.querySelector('.font-bold')
        const name = clean(bold ? bold.textContent : a.textContent)
        const href = a.getAttribute('href')
        try { return { name, url: new URL(href, base).href } } catch(e){ return null }
      }).filter(Boolean).filter(i=>i.url.toLowerCase().includes('.pdf'))
      let folderGuess = ''
      const h1 = document.querySelector('h1, .course-title, .font-bold')
      if(h1) folderGuess = clean(h1.textContent.split('\n')[0])
      return { items, folderGuess }
    }
  })
  return res?.[0]?.result || { items: [], folderGuess: '' }
}

chrome.action.onClicked.addListener(async (tab) => {
  if(!tab?.id) return
  const { items, folderGuess } = await extractFromPage(tab.id)
  if(!items.length) {
    console.log('No PDFs found.')
    return
  }
  let folder = folderGuess || (new URL(tab.url)).pathname.split('/').filter(Boolean).pop() || (new URL(tab.url)).hostname || 'bits_library'
  folder = sanitizeName(folder)
  for (const it of items) {
    try {
      const urlObj = new URL(it.url)
      const urlName = decodeURIComponent(urlObj.pathname.split('/').pop() || 'file.pdf')
      const baseName = sanitizeName((it.name || urlName).replace(/\s+/g,' '))
      const filename = `${folder}/${baseName}-${Math.random().toString(36).slice(2,8)}-${urlName}`
      chrome.downloads.download({ url: it.url, filename, conflictAction: 'uniquify', saveAs: false })
    } catch (e) { console.error('download error', e) }
  }
  console.log(`Started ${items.length} downloads to ${folder}`)
})
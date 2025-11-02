// content_script.js
// Listens for a 'collectLinks' message and returns all anchor hrefs inside
// <ul> elements whose class contains 'ResourceList' (flexible selector).

function extractLinksFromResourceLists() {
  const links = [];
  const seenHrefs = new Set(); // Track unique hrefs to avoid duplicates
  
  // Select ul elements whose class attribute contains 'ResourceList' (robust to hashed class names)
  const uls = document.querySelectorAll('ul[class*="ResourceList"]');
  uls.forEach(ul => {
    ul.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      if (!href || seenHrefs.has(href)) return; // Skip if empty or already seen
      
      seenHrefs.add(href); // Mark this href as seen
      
      // Derive a filename: prefer anchor text, otherwise last path segment
      let filename = (a.textContent || '').trim();
      if (!filename) {
        try {
          const u = new URL(href);
          const seg = u.pathname.split('/').filter(Boolean).pop() || 'download';
          filename = decodeURIComponent(seg).replace(/\+/g, ' ');
        } catch (e) {
          filename = 'download';
        }
      }
      // If filename contains query or looks like url, strip query
      filename = filename.split('?')[0];
      links.push({ href, filename });
    });
  });
  return links;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'collectLinks') {
    try {
      const links = extractLinksFromResourceLists();
      sendResponse({ ok: true, links });
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
    // indicate sync response
    return true;
  }
});

# UL Href Bulk Downloader (Chrome extension)

This small Chrome extension finds all anchor hrefs inside UL elements whose class contains "ResourceList" (useful for the HTML you provided), and lets you download them all at once.

Files added:
- `manifest.json` — extension manifest (MV3).
- `content_script.js` — extracts links from page ULs with class containing "ResourceList".
- `popup.html` & `popup.js` — UI to collect and download links.

How to use
1. Open Chrome and go to chrome://extensions
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and select this folder: c:\\Users\\princ\\OneDrive\\Desktop\\donwlaoder
4. Open the page that contains the resource list (the page you posted).
5. Click the extension icon, then "Collect links from page".
6. When links appear, click "Download all".

Notes & caveats
- Chrome will prompt or block downloads depending on your settings; the extension requests using the downloads API so files are queued programmatically.
- Filenames are derived from the anchor text if present; otherwise from the URL path.
- If a site prevents content scripts from running (CSP), the collect step may not respond. In that case you can allow the extension on that site in the Chrome extensions page or use the DevTools console to run a small snippet that calls the same extractor logic.

If you want I can:
- Add an option to rename files or choose a target folder structure.
- Show a progress indicator per-download and handle failures more gracefully.

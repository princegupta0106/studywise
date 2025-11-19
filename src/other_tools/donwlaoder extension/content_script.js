// content_script.js
// Simple folder clicker - clicks folders sequentially with 1-second intervals

function getFolders() {
  const folders = [];
  
  // Find all folder items - look for elements with folder names
  const folderElements = document.querySelectorAll('.ResourceList_folderName__iLnyD, [class*="folderName"]');
  
  folderElements.forEach(folderElement => {
    const folderName = folderElement.textContent.trim();
    if (folderName) {
      // Find the parent li element to click on
      const parentLi = folderElement.closest('li');
      if (parentLi) {
        folders.push({
          name: folderName,
          element: parentLi,
          folderNameElement: folderElement
        });
      }
    }
  });
  
  return folders;
}

// Function to wait for content to load with MutationObserver
function waitForContentLoad(ulElement, folderName, maxWaitTime = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Check if content is already there
    if (ulElement.querySelectorAll('a[href]').length > 0) {
      console.log(`📦 Content already present in ${folderName}`);
      resolve(true);
      return;
    }
    
    console.log(`👁️ Watching for content changes in ${folderName}...`);
    
    // Set up mutation observer to watch for changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const links = ulElement.querySelectorAll('a[href]').length;
          if (links > 0) {
            console.log(`🎉 MUTATION DETECTED! ${folderName} loaded ${links} links`);
            observer.disconnect();
            resolve(true);
          }
        }
        
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const links = ulElement.querySelectorAll('a[href]').length;
          console.log(`🔄 Class change detected on ${folderName}, links: ${links}`);
          if (links > 0) {
            observer.disconnect();
            resolve(true);
          }
        }
      });
    });
    
    // Start observing
    observer.observe(ulElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      const finalLinks = ulElement.querySelectorAll('a[href]').length;
      console.log(`⏰ Timeout for ${folderName}, final links: ${finalLinks}`);
      resolve(finalLinks > 0);
    }, maxWaitTime);
  });
}

function clickElement(element) {
  // Focus specifically on li -> ul expansion with dynamic content loading
  const folderNameEl = element.querySelector('.ResourceList_folderName__iLnyD, [class*="folderName"]');
  const folderName = folderNameEl ? folderNameEl.textContent.trim() : 'Unknown';
  
  console.log(`🎯 Attempting to expand li->ul for folder: ${folderName}`);
  console.log('LI Element:', element);
  
  // Find the associated UL that should expand
  const associatedUL = element.nextElementSibling;
  console.log('Associated UL before click:', associatedUL);
  console.log('UL tag:', associatedUL?.tagName);
  console.log('UL classes:', associatedUL?.className);
  console.log('UL current display:', associatedUL?.style.display);
  console.log('UL current children count:', associatedUL?.children.length);
  console.log('UL has links:', associatedUL?.querySelectorAll('a[href]').length || 0);
  
  // Visual feedback on the LI
  const originalStyle = element.style.cssText;
  element.style.cssText += 'border: 3px solid red !important; background-color: yellow !important;';
  
  // Method 1: Direct LI click (standard approach)
  console.log('🖱️ Method 1: Direct LI click');
  element.click();
  
  // Method 2: Click events with proper bubbling on LI
  console.log('🖱️ Method 2: LI click event with bubbling');
  const clickEvent = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
    detail: 1
  });
  element.dispatchEvent(clickEvent);
  
  // Method 3: Try clicking the folder name div inside LI
  if (folderNameEl) {
    console.log('🖱️ Method 3: Folder name div click');
    folderNameEl.click();
    folderNameEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  
  // Method 4: Try to trigger any existing event listeners
  setTimeout(() => {
    console.log('🖱️ Method 4: Triggering potential React/JS events');
    
    // Try different target elements
    const targets = [element, folderNameEl].filter(Boolean);
    
    targets.forEach(target => {
      // React synthetic events
      ['onClick', 'onMouseDown', 'onPointerDown'].forEach(eventName => {
        if (target[eventName]) {
          console.log(`Found ${eventName} on`, target);
          try {
            target[eventName]({ preventDefault: () => {}, stopPropagation: () => {} });
          } catch (e) {
            console.log(`${eventName} failed:`, e);
          }
        }
      });
      
      // Check for data attributes that might indicate handlers
      if (target.dataset) {
        console.log('Element data attributes:', target.dataset);
      }
    });
  }, 100);
  
  // Method 5: Wait and check for lazy loading
  setTimeout(() => {
    console.log('🖱️ Method 5: Checking for dynamic content loading');
    
    // Look for loading indicators or empty states
    if (associatedUL) {
      const loadingElements = associatedUL.querySelectorAll('[class*="loading"], [class*="spinner"], .loading, .spinner');
      const emptyElements = associatedUL.querySelectorAll('[class*="empty"], .empty, .no-content');
      
      console.log('Loading indicators found:', loadingElements.length);
      console.log('Empty state elements found:', emptyElements.length);
      
      // If UL is empty but exists, might need to wait for AJAX
      if (associatedUL.children.length === 0) {
        console.log('UL exists but empty - might be loading content...');
        
        // Try to trigger potential AJAX calls by adding show classes
        associatedUL.classList.add('show', 'expanded', 'ResourceList_show__csKfp', 'active', 'open');
        associatedUL.style.display = 'block';
        associatedUL.style.visibility = 'visible';
        
        // Also try on the LI
        element.classList.add('expanded', 'active', 'open', 'selected');
      }
    }
  }, 300);
  
  // Method 6: Try more aggressive DOM manipulation
  setTimeout(() => {
    console.log('🖱️ Method 6: Aggressive UL manipulation');
    
    if (associatedUL && associatedUL.children.length === 0) {
      // Sometimes content is hidden by CSS
      associatedUL.style.cssText = 'display: block !important; visibility: visible !important; height: auto !important; overflow: visible !important;';
      
      // Check if there's any innerHTML that's hidden
      console.log('UL innerHTML length:', associatedUL.innerHTML.length);
      console.log('UL innerHTML preview:', associatedUL.innerHTML.substring(0, 200));
      
      // Look for script tags or templates that might populate content
      const scripts = document.querySelectorAll('script');
      const hasDataScripts = Array.from(scripts).some(script => 
        script.textContent.includes(folderName) || 
        script.textContent.includes('ResourceList') ||
        script.textContent.includes('folder')
      );
      console.log('Found potential data scripts:', hasDataScripts);
    }
  }, 500);
  
  // Method 7: Monitor for changes over longer period
  let changeCheckCount = 0;
  const maxChecks = 10; // Check for 5 seconds
  
  const checkForChanges = () => {
    changeCheckCount++;
    
    if (associatedUL && changeCheckCount <= maxChecks) {
      const currentLinks = associatedUL.querySelectorAll('a[href]').length;
      const currentChildren = associatedUL.children.length;
      
      if (currentLinks > 0) {
        console.log(`🎉 DELAYED SUCCESS! Folder ${folderName} loaded ${currentLinks} links after ${changeCheckCount * 500}ms`);
        return;
      }
      
      if (changeCheckCount < maxChecks) {
        setTimeout(checkForChanges, 500);
      } else {
        console.log(`⏰ Timeout: ${folderName} still has no content after ${maxChecks * 500}ms`);
      }
    }
  };
  
  setTimeout(checkForChanges, 800);
  
  // Restore visual style
  setTimeout(() => {
    element.style.cssText = originalStyle;
  }, 2000);
}

async function clickAllFoldersSequentially() {
  const folders = getFolders();
  console.log('🔍 Found folders to click:', folders.map(f => f.name));
  
  // Log detailed info about each folder's structure
  folders.forEach((folder, index) => {
    const associatedUL = folder.element.nextElementSibling;
    console.log(`📁 Folder ${index + 1}: ${folder.name}`, {
      liElement: folder.element,
      liClasses: folder.element.className,
      liId: folder.element.id,
      hasULSibling: !!associatedUL,
      ulTag: associatedUL?.tagName,
      ulClasses: associatedUL?.className,
      ulInitialLinks: associatedUL?.querySelectorAll('a[href]').length || 0,
      ulInitialChildren: associatedUL?.children.length || 0
    });
  });
  
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    console.log(`\n🎯 === CLICKING FOLDER ${i + 1}/${folders.length}: ${folder.name} ===`);
    
    // Check current state of associated UL before clicking
    const associatedUL = folder.element.nextElementSibling;
    const beforeState = {
      hasUL: !!associatedUL,
      ulTag: associatedUL?.tagName,
      ulDisplay: associatedUL?.style.display,
      ulClasses: associatedUL?.className,
      ulChildren: associatedUL?.children.length || 0,
      ulLinks: associatedUL?.querySelectorAll('a[href]').length || 0,
      ulVisible: associatedUL ? (associatedUL.style.display !== 'none' && !associatedUL.classList.contains('hidden')) : false
    };
    console.log('📊 UL state before click:', beforeState);
    
    // Click the folder (this will do extensive logging internally)
    clickElement(folder.element);
    
    // If there's an associated UL, wait for it to load content
    if (associatedUL && associatedUL.tagName === 'UL') {
      console.log(`👁️ Waiting for ${folder.name} to load content...`);
      const contentLoaded = await waitForContentLoad(associatedUL, folder.name, 2000); // Reduced to 2 seconds
      console.log(`📊 Content loaded for ${folder.name}: ${contentLoaded ? '✅' : '❌'}`);
    } else {
      console.log(`⚠️ No UL found for ${folder.name} to monitor`);
    }
    
    // Send progress update to popup
    chrome.runtime.sendMessage({
      type: 'folderClicked',
      folderName: folder.name,
      folderIndex: i + 1,
      totalFolders: folders.length,
      isLast: i === folders.length - 1
    });
    
    // Wait longer and check what happened to the UL
    await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2500 to 1000ms
    
    const afterState = {
      hasUL: !!associatedUL,
      ulTag: associatedUL?.tagName,
      ulDisplay: associatedUL?.style.display,
      ulClasses: associatedUL?.className,
      ulChildren: associatedUL?.children.length || 0,
      ulLinks: associatedUL?.querySelectorAll('a[href]').length || 0,
      ulVisible: associatedUL ? (associatedUL.style.display !== 'none' && !associatedUL.classList.contains('hidden')) : false
    };
    console.log('📊 UL state after click:', afterState);
    
    // Compare states to see if anything changed
    const stateChanged = JSON.stringify(beforeState) !== JSON.stringify(afterState);
    const linksAdded = afterState.ulLinks > beforeState.ulLinks;
    const childrenAdded = afterState.ulChildren > beforeState.ulChildren;
    
    console.log(`🔄 Folder ${folder.name} results:`);
    console.log(`  - State changed: ${stateChanged ? '✅' : '❌'}`);
    console.log(`  - Links added: ${linksAdded ? '✅' : '❌'} (${beforeState.ulLinks} → ${afterState.ulLinks})`);
    console.log(`  - Children added: ${childrenAdded ? '✅' : '❌'} (${beforeState.ulChildren} → ${afterState.ulChildren})`);
    
    if (afterState.ulLinks > 0) {
      console.log(`🎉 SUCCESS! Found ${afterState.ulLinks} downloadable links in ${folder.name}`);
    } else if (afterState.ulChildren > 0) {
      console.log(`⚠️ Folder ${folder.name} has content but no downloadable links`);
    } else {
      console.log(`❌ Folder ${folder.name} did not expand or has no content`);
    }
    
    // Wait 0.2 seconds before next folder (except for last)
    if (i < folders.length - 1) {
      console.log('⏳ Waiting 0.2 seconds before next folder...');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log('\n🏁 Finished clicking all folders');
  
  // Final summary
  const finalSummary = folders.map(folder => {
    const associatedUL = folder.element.nextElementSibling;
    const links = associatedUL?.querySelectorAll('a[href]').length || 0;
    return { name: folder.name, links, expanded: links > 0 };
  });
  
  console.log('📈 Final Summary:', finalSummary);
  const totalLinks = finalSummary.reduce((sum, folder) => sum + folder.links, 0);
  const expandedFolders = finalSummary.filter(folder => folder.expanded).length;
  console.log(`📊 Total: ${expandedFolders}/${folders.length} folders expanded, ${totalLinks} total links found`);
  
  return { success: true, foldersClicked: folders.length, summary: finalSummary };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'getFolders') {
    try {
      const folders = getFolders();
      sendResponse({ ok: true, folders: folders.map(f => f.name) });
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
    return true;
  }
  
  if (msg && msg.type === 'clickAllFolders') {
    (async () => {
      try {
        const result = await clickAllFoldersSequentially();
        sendResponse({ ok: true, result });
      } catch (err) {
        console.error('Error clicking folders:', err);
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }
  
  if (msg && msg.type === 'highlightFolders') {
    try {
      const folders = getFolders();
      folders.forEach((folder, index) => {
        setTimeout(() => {
          const originalStyle = folder.element.style.cssText;
          folder.element.style.cssText += 'border: 2px solid blue !important; background-color: lightblue !important;';
          setTimeout(() => {
            folder.element.style.cssText = originalStyle;
          }, 2000);
        }, index * 300);
      });
      sendResponse({ ok: true, message: `Highlighted ${folders.length} folders` });
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
    return true;
  }
});

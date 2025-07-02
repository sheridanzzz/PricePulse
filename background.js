// Background service worker for the price comparison extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Price Comparison Extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'productDetected') {
    console.log('Product detected:', request.data);
    
    // Update extension badge to indicate product found
    if (sender.tab) {
      chrome.action.setBadgeText({
        text: '!',
        tabId: sender.tab.id
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: '#007bff',
        tabId: sender.tab.id
      });
    }
    
    sendResponse({ status: 'received' });
  }
  
  return true; // Keep the message channel open for async response
});

// Clear badge when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
    
    // Clear stored product data for this tab
    chrome.storage.local.remove([`product_${tabId}`]);
  }
});

// Clean up storage when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([`product_${tabId}`]);
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically due to default_popup in manifest
  console.log('Extension icon clicked for tab:', tab.id);
});

// Periodic cleanup of old storage entries
chrome.alarms.create('cleanupStorage', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupStorage') {
    cleanupOldStorageEntries();
  }
});

async function cleanupOldStorageEntries() {
  try {
    const storage = await chrome.storage.local.get();
    const keysToRemove = [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [key, value] of Object.entries(storage)) {
      if (key.startsWith('product_') && value.extractedAt && value.extractedAt < oneHourAgo) {
        keysToRemove.push(key);
      }
    }
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log('Cleaned up old storage entries:', keysToRemove.length);
    }
  } catch (error) {
    console.error('Error cleaning up storage:', error);
  }
}

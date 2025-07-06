// Debug script to test extension functionality
// Run this in the browser console on Amazon AU product page

(async function debugExtension() {
  console.log('[PricePulse-Debug] Starting extension debug...');
  
  try {
    // 1. Check if content script is loaded
    console.log('[PricePulse-Debug] Testing if content script is available...');
    if (typeof extractProductData === 'function') {
      console.log('[PricePulse-Debug] ✅ Content script loaded');
    } else {
      console.log('[PricePulse-Debug] ❌ Content script not loaded');
    }
    
    // 2. Test direct product extraction
    console.log('[PricePulse-Debug] Testing direct product extraction...');
    // This will be available if content script is loaded
    
    // 3. Check current tab ID
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[PricePulse-Debug] Current tab ID:', tab.id);
    
    // 4. Check all storage
    const allStorage = await chrome.storage.local.get(null);
    console.log('[PricePulse-Debug] All storage keys:', Object.keys(allStorage));
    console.log('[PricePulse-Debug] All storage data:', allStorage);
    
    // 5. Test background script communication
    console.log('[PricePulse-Debug] Testing background script communication...');
    chrome.runtime.sendMessage({ action: 'test', debug: true }, (response) => {
      console.log('[PricePulse-Debug] Background script response:', response);
    });
    
    // 6. Look for product key
    const productKey = `product_${tab.id}`;
    if (allStorage[productKey]) {
      console.log('[PricePulse-Debug] ✅ Product data found:', allStorage[productKey]);
    } else {
      console.log('[PricePulse-Debug] ❌ No product data for key:', productKey);
    }
    
    // 7. Wait a bit and check again
    setTimeout(async () => {
      const updatedStorage = await chrome.storage.local.get(null);
      console.log('[PricePulse-Debug] Updated storage after 5 seconds:', updatedStorage);
    }, 5000);
    
  } catch (error) {
    console.error('[PricePulse-Debug] Error:', error);
  }
})();

// Also add this to window so it can be called manually
window.debugPricePulse = async function() {
  const allStorage = await chrome.storage.local.get(null);
  console.log('Current storage:', allStorage);
}; 
// Debug script to check Chrome storage
// Run this in the browser console on any page where the extension is active

(async function debugStorage() {
  console.log('[PricePulse-Debug] Checking Chrome storage...');
  
  try {
    // Get all storage data
    const allData = await chrome.storage.local.get(null);
    console.log('[PricePulse-Debug] All storage keys:', Object.keys(allData));
    console.log('[PricePulse-Debug] All storage data:', allData);
    
    // Get current tab ID
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[PricePulse-Debug] Current tab ID:', tab.id);
    
    // Check for product data for current tab
    const productKey = `product_${tab.id}`;
    console.log('[PricePulse-Debug] Looking for key:', productKey);
    
    if (allData[productKey]) {
      console.log('[PricePulse-Debug] Product data found:', allData[productKey]);
    } else {
      console.log('[PricePulse-Debug] No product data found for current tab');
    }
    
    // Check for any product keys
    const productKeys = Object.keys(allData).filter(key => key.startsWith('product_'));
    console.log('[PricePulse-Debug] All product keys found:', productKeys);
    
  } catch (error) {
    console.error('[PricePulse-Debug] Error:', error);
  }
})(); 
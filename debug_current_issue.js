// Comprehensive debug script for current detection issue
console.log('=== PricePulse Debug Session ===');

// 1. Check if we're on the right URL
console.log('1. Current URL:', window.location.href);
console.log('   Hostname:', window.location.hostname);
console.log('   Pathname:', window.location.pathname);

// 2. Check if content script functions are available
console.log('2. Content Script Check:');
console.log('   performExtraction available:', typeof window.performExtraction);
console.log('   extractProductData available:', typeof window.extractProductData);

// 3. Test product detection manually
if (typeof window.extractProductData === 'function') {
  console.log('3. Manual Product Extraction:');
  try {
    const productData = window.extractProductData();
    console.log('   Result:', productData);
  } catch (error) {
    console.error('   Error:', error);
  }
} else {
  console.log('3. Content script not loaded - checking basic elements:');
  
  // Check for basic Amazon elements
  const titleEl = document.querySelector('#productTitle');
  console.log('   Product title element:', titleEl);
  console.log('   Title text:', titleEl?.textContent?.trim());
  
  const priceEl = document.querySelector('.a-price .a-price-amount');
  console.log('   Price element:', priceEl);
  console.log('   Price text:', priceEl?.textContent?.trim());
}

// Add manual trigger function
window.manualTrigger = function() {
  console.log('Manual trigger activated');
  if (window.performExtraction) {
    window.performExtraction();
  } else {
    console.log('performExtraction not available');
  }
}; 
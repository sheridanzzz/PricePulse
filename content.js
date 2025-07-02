// Content script to extract product information from marketplace pages
(function() {
  'use strict';
  
  // Product extraction configurations for different marketplaces
  const extractors = {
    amazon: {
      title: [
        '#productTitle',
        '#title',
        '.product-title',
        'h1.a-size-large'
      ],
      price: [
        '.a-price-current .a-price-amount',
        '.a-price .a-price-amount',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-size-medium.a-color-price',
        '.a-price-range'
      ],
      image: [
        '#landingImage',
        '#imgBlkFront',
        '.a-dynamic-image',
        '.imgTagWrapper img'
      ]
    },
    ebay: {
      title: [
        '#x-title-label-lbl',
        '.x-item-title-label',
        'h1#it-ttl',
        '.notranslate'
      ],
      price: [
        '.notranslate',
        '#prcIsum',
        '#mm-saleDscPrc',
        '.notranslate span'
      ],
      image: [
        '#icImg',
        '#image',
        '.ux-image-magnify__container img'
      ]
    },
    walmart: {
      title: [
        '[data-automation-id="product-title"]',
        'h1[data-automation-id="product-title"]',
        '.prod-ProductTitle'
      ],
      price: [
        '[data-automation-id="product-price"]',
        '.price-current',
        '.price-group .price-current',
        '[itemprop="price"]'
      ],
      image: [
        '[data-testid="hero-image-container"] img',
        '.prod-hero-image img',
        '.hero-image img'
      ]
    },
    target: {
      title: [
        '[data-test="product-title"]',
        'h1[data-test="product-title"]',
        '.pdp-product-name'
      ],
      price: [
        '[data-test="product-price"]',
        '.price-current',
        '.sr-only:contains("current price")'
      ],
      image: [
        '[data-test="hero-image"] img',
        '.ProductImages img',
        '.slide img'
      ]
    }
  };
  
  function detectMarketplace() {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('ebay')) return 'ebay';
    if (hostname.includes('walmart')) return 'walmart';
    if (hostname.includes('target')) return 'target';
    return null;
  }
  
  function extractText(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.innerText;
        if (text && text.trim()) {
          return text.trim();
        }
      }
    }
    return null;
  }
  
  function extractImage(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const src = element.src || element.getAttribute('src');
        if (src && src.startsWith('http')) {
          return src;
        }
      }
    }
    return null;
  }
  
  function cleanPrice(priceText) {
    if (!priceText) return null;
    
    // Remove common price prefixes and suffixes
    let cleaned = priceText
      .replace(/current price/gi, '')
      .replace(/was price/gi, '')
      .replace(/sale price/gi, '')
      .replace(/price/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract price pattern ($XX.XX or XX.XX)
    const priceMatch = cleaned.match(/\$?[\d,]+\.?\d*/);
    if (priceMatch) {
      let price = priceMatch[0];
      if (!price.startsWith('$')) {
        price = '$' + price;
      }
      return price;
    }
    
    return cleaned;
  }
  
  function extractProductData() {
    const marketplace = detectMarketplace();
    if (!marketplace || !extractors[marketplace]) {
      console.log('Unsupported marketplace:', marketplace);
      return null;
    }
    
    const config = extractors[marketplace];
    
    const title = extractText(config.title);
    const rawPrice = extractText(config.price);
    const price = cleanPrice(rawPrice);
    const image = extractImage(config.image);
    
    if (!title) {
      console.log('Could not extract product title');
      return null;
    }
    
    const productData = {
      title,
      price,
      image,
      marketplace,
      url: window.location.href,
      extractedAt: Date.now()
    };
    
    console.log('Extracted product data:', productData);
    return productData;
  }
  
  async function saveProductData(productData) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.storage.local.set({
        [`product_${tab.id}`]: productData
      });
      console.log('Product data saved to storage');
    } catch (error) {
      console.error('Error saving product data:', error);
    }
  }
  
  function initializeExtraction() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', performExtraction);
    } else {
      performExtraction();
    }
  }
  
  function performExtraction() {
    // Add a small delay to ensure dynamic content is loaded
    setTimeout(() => {
      const productData = extractProductData();
      if (productData) {
        // Send message to background script
        chrome.runtime.sendMessage({
          action: 'productDetected',
          data: productData
        });
        
        // Also save to local storage for popup access
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.storage.local.set({
              [`product_${tabs[0].id}`]: productData
            });
          }
        });
      }
    }, 2000);
  }
  
  // Initialize extraction
  initializeExtraction();
  
  // Re-run extraction on URL changes (for SPAs)
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(performExtraction, 3000);
    }
  }).observe(document.body, { childList: true, subtree: true });
  
})();

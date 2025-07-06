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
        'h1.a-size-large',
        'h1[data-automation-id="product-title"]',
        'span#productTitle',
        '.a-size-large.product-title-word-break'
      ],
      price: [
        '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
        '.a-price-current .a-price-amount',
        '.a-price .a-price-amount',
        '.a-price-to-pay .a-price-amount',
        '.a-price-whole',
        'span.a-price-whole',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-size-medium.a-color-price',
        '.a-price-range',
        '.a-offscreen:not(:empty)',
        '.a-price .a-offscreen',
        '[data-a-price-amount]',
        '[data-testid="price"] .a-offscreen'
      ],
      image: [
        '#landingImage',
        '#imgBlkFront',
        '.a-dynamic-image',
        '.imgTagWrapper img',
        'img[data-old-hires]',
        'img[data-a-dynamic-image]'
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
    const pathname = window.location.pathname.toLowerCase();
    
    // Amazon detection for all international domains
    if (hostname.includes('amazon')) {
      // Check if this is actually a product page by looking for product indicators
      if (pathname.includes('/dp/') || 
          pathname.includes('/gp/product/') || 
          document.querySelector('#productTitle') ||
          document.querySelector('span#productTitle') ||
          document.querySelector('.a-price') ||
          pathname.includes('/product/') ||
          pathname.includes('/item/')) {
        
        // Return specific marketplace based on domain
        if (hostname.includes('amazon.com.au')) return 'amazon_au';
        if (hostname.includes('amazon.co.uk')) return 'amazon_uk';
        if (hostname.includes('amazon.ca')) return 'amazon_ca';
        if (hostname.includes('amazon.de')) return 'amazon_de';
        return 'amazon'; // Default to US Amazon
      }
    }
    
    // eBay detection with regional variants
    if (hostname.includes('ebay')) {
      if (hostname.includes('ebay.com.au')) return 'ebay_au';
      if (hostname.includes('ebay.co.uk')) return 'ebay_uk';
      if (hostname.includes('ebay.ca')) return 'ebay_ca';
      return 'ebay'; // Default to US eBay
    }
    
    // Target detection with regional variants
    if (hostname.includes('target')) {
      if (hostname.includes('target.com.au')) return 'target_au';
      return 'target'; // Default to US Target
    }
    
    if (hostname.includes('walmart')) return 'walmart';
    
    return null;
  }
  
  function extractText(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.innerText;
        if (text && text.trim()) {
          const trimmed = text.trim();
          // Skip elements with meaningless content
          if (trimmed !== '()' && trimmed !== '' && trimmed.length > 1) {
            return trimmed;
          }
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
    
    // Extract price pattern with various currency symbols
    const priceMatch = cleaned.match(/[A-Z$£€¥₹₽]\s*[\d,]+\.?\d*|\$[\d,]+\.?\d*|[\d,]+\.?\d*\s*[A-Z$£€¥₹₽]|[\d,]+\.?\d*/);
    if (priceMatch) {
      let price = priceMatch[0].trim();
      
      // Add $ prefix if no currency symbol is present
      if (!/[A-Z$£€¥₹₽]/.test(price)) {
        price = '$' + price;
      }
      
      // Clean up formatting
      price = price.replace(/\s+/g, '');
      
      return price;
    }
    
    return cleaned;
  }
  
  function extractProductData() {
    const marketplace = detectMarketplace();
    console.log('[PricePulse] Detected marketplace:', marketplace);
    console.log('[PricePulse] Current URL:', window.location.href);
    
    if (!marketplace) {
      console.log('[PricePulse] No marketplace detected');
      return null;
    }
    
    // Map regional variants to base configurations
    let configKey = marketplace;
    if (marketplace.startsWith('amazon_')) {
      configKey = 'amazon';
    } else if (marketplace.startsWith('ebay_')) {
      configKey = 'ebay';
    } else if (marketplace.startsWith('target_')) {
      configKey = 'target';
    }
    
    const config = extractors[configKey];
    if (!config) {
      console.log('[PricePulse] Unsupported marketplace:', marketplace);
      return null;
    }
    console.log('[PricePulse] Using config for:', marketplace, config);
    
    // Debug title extraction
    console.log('[PricePulse] Trying title selectors:', config.title);
    const title = extractText(config.title);
    console.log('[PricePulse] Extracted title:', title);
    
    // Debug price extraction  
    console.log('[PricePulse] Trying price selectors:', config.price);
    
    // Debug: Check what each price selector finds
    config.price.forEach((selector, index) => {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`[PricePulse] Price selector ${index} (${selector}) found:`, {
          text: element.textContent?.trim(),
          innerHTML: element.innerHTML?.trim(),
          className: element.className,
          id: element.id
        });
      }
    });
    
    const rawPrice = extractText(config.price);
    console.log('[PricePulse] Raw price:', rawPrice);
    const price = cleanPrice(rawPrice);
    console.log('[PricePulse] Cleaned price:', price);
    
    // Debug image extraction
    console.log('[PricePulse] Trying image selectors:', config.image);
    const image = extractImage(config.image);
    console.log('[PricePulse] Extracted image:', image);
    
    if (!title) {
      console.log('[PricePulse] Could not extract product title - checking page structure');
      // Log all potential title elements for debugging
      const allH1 = document.querySelectorAll('h1');
      console.log('[PricePulse] All H1 elements found:', Array.from(allH1).map(h1 => ({
        text: h1.textContent?.trim(),
        id: h1.id,
        classes: h1.className
      })));
      
      const allSpans = document.querySelectorAll('span[id*="title"], span[id*="Title"]');
      console.log('[PricePulse] All title-related spans:', Array.from(allSpans).map(span => ({
        text: span.textContent?.trim(),
        id: span.id,
        classes: span.className
      })));
      
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
    
    console.log('[PricePulse] Successfully extracted product data:', productData);
    return productData;
  }
  
  // Remove this function - we'll handle storage in background script
  
  function initializeExtraction() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', performExtraction);
    } else {
      performExtraction();
    }
  }
  
  function performExtraction() {
    console.log('[PricePulse] Starting product extraction');
        const productData = extractProductData();
      if (productData) {
        console.log('[PricePulse] Product detected! Showing overlay notification');
        
        // Send product data to background script for comparison and overlay display
        chrome.runtime.sendMessage({
          action: 'fetchComparisonAndShowOverlay',
          productData: productData
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[PricePulse] Runtime error:', chrome.runtime.lastError);
          } else if (response && response.status === 'success') {
            console.log('[PricePulse] ✅ Background script processed comparison and overlay');
          } else if (response && response.status === 'error') {
            console.error('[PricePulse] ❌ Background script error:', response.message);
          }
        });
      } else {
        console.log('[PricePulse] No product data extracted - not saving');
      }
  }
  
  // Initialize extraction
  initializeExtraction();
  
  // Re-run extraction on URL changes (for SPAs)
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      performExtraction();
    }
  }).observe(document.body, { childList: true, subtree: true });
  
  // Expose functions globally for debugging and manual triggers
  window.performExtraction = performExtraction;
  window.extractProductData = extractProductData;
  console.log('[PricePulse] Content script loaded and functions exposed globally');

  // Listen for messages from the background script to show the overlay
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showOverlay') {
      console.log('[PricePulse] Received showOverlay message from background');
      // Ensure PricePulseOverlay is initialized before showing
      const checkOverlay = setInterval(() => {
        if (window.PricePulseOverlay) {
          clearInterval(checkOverlay);
          console.log('[PricePulse] Calling PricePulseOverlay.show()');
          window.PricePulseOverlay.show(message.productData, message.comparisonResults, message.error);
        } else {
          console.log('[PricePulse] Waiting for PricePulseOverlay to initialize...');
        }
      }, 100); // Check every 100ms
    }
  });
  
})();

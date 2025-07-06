// Overlay notification system for price comparison
(function() {
  'use strict';
  
  let overlayContainer = null;

  const marketplaceLogos = {
    'amazon': 'icons/amazon_logo.png',
    'amazon_au': 'icons/amazon_au_logo.png',
    'ebay': 'icons/ebay_logo.png',
    'ebay_au': 'icons/ebay_au_logo.png',
    'walmart': 'icons/walmart_logo.png',
    'target': 'icons/target_logo.png',
    'target_au': 'icons/target_au_logo.png',
    'jbhifi_au': 'icons/jbhifi_au_logo.png',
    'thegoodguys_au': 'icons/thegoodguys_au_logo.png',
    'mydeal_au': 'icons/mydeal_au_logo.png'
  };

  function getMarketplaceLogo(marketplace) {
    const relativePath = marketplaceLogos[marketplace];
    if (relativePath) {
      return chrome.runtime.getURL(relativePath);
    }
    return '';
  }

  function getMarketplaceName(marketplace) {
    const names = {
      'amazon': 'Amazon US', 'amazon_au': 'Amazon AU', 'amazon_uk': 'Amazon UK',
      'ebay': 'eBay US', 'ebay_au': 'eBay AU', 'walmart': 'Walmart', 'target': 'Target US',
      'target_au': 'Target AU', 'jbhifi_au': 'JB Hi-Fi', 'thegoodguys_au': 'The Good Guys',
      'mydeal_au': 'MyDeal'
    };
    return names[marketplace] || marketplace.replace(/_au$/, '').replace(/_/g, ' ').toUpperCase();
  }

  function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const match = priceStr.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  }

  // Create and inject overlay styles
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #pricepulse-overlay {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 350px;
        max-height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        transition: all 0.3s ease;
        border: 1px solid #e1e5e9;
      }
      
      #pricepulse-overlay.hidden {
        transform: translateY(100px);
        opacity: 0;
        pointer-events: none;
      }
      
      .pricepulse-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .pricepulse-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
      
      .pricepulse-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .pricepulse-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .pricepulse-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .pricepulse-product {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e1e5e9;
      }
      
      .pricepulse-product-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid #e1e5e9;
      }
      
      .pricepulse-product-info {
        flex: 1;
      }
      
      .pricepulse-product-title {
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 4px 0;
        color: #1a1a1a;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .pricepulse-product-price {
        font-size: 18px;
        font-weight: 600;
        color: #0066cc;
        margin: 0;
      }
      
      .pricepulse-marketplace {
        display: inline-block;
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        margin-top: 4px;
      }
      
      .pricepulse-loading {
        text-align: center;
        padding: 20px;
        color: #666;
      }
      
      .pricepulse-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid #e1e5e9;
        border-top: 2px solid #667eea;
        border-radius: 50%;
        animation: pricepulse-spin 1s linear infinite;
        margin-right: 8px;
      }
      
      @keyframes pricepulse-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .pricepulse-results {
        margin-top: 16px;
      }
      
      .pricepulse-result-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        margin-bottom: 8px;
        background: #f8f9fa;
        border-radius: 8px;
        transition: background 0.2s;
        cursor: pointer;
      }
      
      .pricepulse-result-item:hover {
        background: #e9ecef;
      }
      
      .pricepulse-result-item.best-deal {
        background: #d4edda;
        border: 1px solid #c3e6cb;
      }
      
      .pricepulse-result-info {
        flex: 1;
      }
      
      .pricepulse-result-marketplace {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .pricepulse-result-price {
        font-size: 16px;
        font-weight: 600;
        color: #28a745;
        margin-bottom: 2px;
      }
      
      .pricepulse-savings {
        background: #28a745;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        margin-left: 8px;
      }
      
      .pricepulse-no-results {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
      }
      
      .pricepulse-marketplace-logo {
        width: 20px;
        height: 20px;
        margin-right: 5px;
        vertical-align: middle;
        border-radius: 4px;
      }
      
      .pricepulse-product-image-small {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid #e1e5e9;
        margin-top: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  // Create overlay container
  function createOverlay() {
    if (overlayContainer) return overlayContainer;
    
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'pricepulse-overlay';
    overlayContainer.className = 'hidden';
    
    overlayContainer.innerHTML = `
      <div class="pricepulse-header">
        <h3 class="pricepulse-title"><i class="fas fa-tags me-2"></i> Price Comparison</h3>
        <button class="pricepulse-close" onclick="window.PricePulseOverlay.hide()">×</button>
      </div>
      <div class="pricepulse-content" id="pricepulse-content">
        <div class="pricepulse-loading">
          <div class="pricepulse-spinner"></div>
          Detecting product...
        </div>
      </div>
    `;
    
    document.body.appendChild(overlayContainer);
    return overlayContainer;
  }
  
  // Show overlay with product data and comparison results
  function showProductOverlay(productData, comparisonResults, error) {
    const overlay = createOverlay();
    const content = document.getElementById('pricepulse-content');
    
    content.innerHTML = `
      <div class="pricepulse-product">
        <img src="${productData.image}" alt="Product" class="pricepulse-product-image" />
        <div class="pricepulse-product-info">
          <h4 class="pricepulse-product-title">${productData.title}</h4>
          <p class="pricepulse-product-price">${productData.price}</p>
          <span class="pricepulse-marketplace">${getMarketplaceName(productData.marketplace)}</span>
        </div>
      </div>
      <div class="pricepulse-loading" id="pricepulse-comparison-loading">
        <div class="pricepulse-spinner"></div>
        Fetching price comparisons...
      </div>
    `;

    overlay.classList.remove('hidden');
    console.log('[PricePulse-Overlay] Overlay visibility after removing hidden class:', overlay.style.display, overlay.classList.contains('hidden'));
  }

  function updateComparisonResults(productData, comparisonResults, error) {
    const content = document.getElementById('pricepulse-content');
    const loadingElement = document.getElementById('pricepulse-comparison-loading');
    if (loadingElement) {
      loadingElement.remove();
    }

    if (error) {
      content.innerHTML += `
        <div class="pricepulse-no-results">
          Error fetching comparisons: ${error}
        </div>
      `;
    } else if (comparisonResults && comparisonResults.length > 0) {
      showComparisonResults(content, productData, comparisonResults);
    } else {
      content.innerHTML += `
        <div class="pricepulse-no-results">
          No similar products found on other marketplaces
        </div>
      `;
    }
  }
  
  function showComparisonResults(content, productData, results) {
    const productHtml = content.querySelector('.pricepulse-product').outerHTML;
    const currentPriceNum = parsePrice(productData.price);
    let resultsHtml = '<div class="pricepulse-results">';
    
    if (results.length === 0) {
      content.innerHTML = productHtml + `
        <div class="pricepulse-no-results">
          No similar products found on other marketplaces
        </div>
      `;
      return;
    }
    
    results.forEach(result => {
      const resultPrice = parsePrice(result.price);
      const isBetter = resultPrice > 0 && resultPrice < currentPriceNum;
      const savings = isBetter ? currentPriceNum - resultPrice : 0;
      
      resultsHtml += `
        <div class="pricepulse-result-item ${isBetter ? 'best-deal' : ''}" onclick="window.open('${result.url}', '_blank')">
          <div class="pricepulse-result-info">
            <div class="pricepulse-result-marketplace">
              ${getMarketplaceLogo(result.marketplace) ? `<img src="${getMarketplaceLogo(result.marketplace)}" alt="${getMarketplaceName(result.marketplace)} Logo" class="pricepulse-marketplace-logo">` : ''}
              ${getMarketplaceName(result.marketplace)}
            </div>
            <div class="pricepulse-result-price">
              ${result.price}
              ${isBetter ? `<span class="pricepulse-savings">Save ${savings.toFixed(2)}</span>` : ''}
            </div>
            <p class="pricepulse-product-title">${result.title}</p>
            ${result.image ? `<img src="${result.image}" alt="Product Image" class="pricepulse-product-image-small">` : ''}
          </div>
        </div>
      `;
    });
    
    resultsHtml += '</div>';
    content.innerHTML = productHtml + resultsHtml;
  }
  
  // Hide overlay
  function hideOverlay() {
    if (overlayContainer) {
      overlayContainer.classList.add('hidden');
    }
  }
  
  // Auto-hide after 10 seconds
  function autoHide() {
    setTimeout(() => {
      if (overlayContainer && !overlayContainer.classList.contains('hidden')) {
        hideOverlay();
      }
    }, 10000);
  }
  
  // Expose global interface
  window.PricePulseOverlay = {
    show: showProductOverlay,
    hide: hideOverlay,
    update: updateComparisonResults,
    init: () => {
      injectStyles();
      createOverlay();
    }
  };
  
  // Initialize immediately
  window.PricePulseOverlay.init();
  
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
          sendResponse({status: 'success'}); // Acknowledge message receipt
        } else {
          console.log('[PricePulse] Waiting for PricePulseOverlay to initialize...');
        }
      }, 100); // Check every 100ms
      return true; // Indicates that the response will be sent asynchronously
    } else if (message.action === 'updateOverlay') {
      console.log('[PricePulse] Received updateOverlay message from background');
      const checkOverlay = setInterval(() => {
        if (window.PricePulseOverlay) {
          clearInterval(checkOverlay);
          console.log('[PricePulse] Calling PricePulseOverlay.update()');
          window.PricePulseOverlay.update(message.productData, message.comparisonResults, message.error);
          sendResponse({status: 'success'}); // Acknowledge message receipt
        } else {
          console.log('[PricePulse] Waiting for PricePulseOverlay to initialize for update...');
        }
      }, 100); // Check every 100ms
      return true; // Indicates that the response will be sent asynchronously
    }
  });
  
})();
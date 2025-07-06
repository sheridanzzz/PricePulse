




  function getMarketplaceName(marketplace) {
  const names = {
    'amazon': 'Amazon US', 'amazon_au': 'Amazon AU', 'amazon_uk': 'Amazon UK',
    'ebay': 'eBay US', 'ebay_au': 'eBay AU', 'walmart': 'Walmart', 'target': 'Target US',
    'target_au': 'Target AU', 'jbhifi_au': 'JB Hi-Fi', 'thegoodguys_au': 'The Good Guys',
    'mydeal_au': 'MyDeal'
  };
  return names[marketplace] || marketplace.replace(/_au$/, '').replace(/_/g, ' ').toUpperCase();
}

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
  return marketplaceLogos[marketplace] || '';
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

document.addEventListener('DOMContentLoaded', async function() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const noProductEl = document.getElementById('no-product');
  const currentProductEl = document.getElementById('current-product');
  const comparisonResultsEl = document.getElementById('comparison-results');
  
  try {
    showLoading();
    console.log('[PricePulse-Popup] Popup opened, checking for product data');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[PricePulse-Popup] Current tab ID:', tab.id);
    
    const storageKey = `product_${tab.id}`;
    const result = await chrome.storage.local.get([storageKey]);
    const productData = result[storageKey];
    
    console.log('[PricePulse-Popup] Product data from storage:', productData);
    
    if (!productData) {
      console.log('[PricePulse-Popup] No product data found in storage, showing no-product message');
      showNoProduct();
      return;
    }
    
    displayCurrentProduct(productData);
    
    showLoading('Searching for better prices...');
    
    // Request comparison data from background script
    const comparisonResponse = await chrome.runtime.sendMessage({
      action: 'fetchComparison',
      productData: productData
    });

    if (comparisonResponse.error) {
      showError(`Failed to fetch comparison data: ${comparisonResponse.error}`);
      return;
    }
    
    if (comparisonResponse.results && comparisonResponse.results.length > 0) {
      console.log('[PricePulse-Popup] Found', comparisonResponse.results.length, 'comparison results');
      displayComparisonResults(comparisonResponse.results, productData.price);
    } else {
      console.log('[PricePulse-Popup] No comparison data found, showing current product only');
      hideOtherSections(['current-product']);
      
      const noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'alert alert-info m-3';
      noResultsMsg.innerHTML = '<i class="fas fa-info-circle me-2"></i>No similar products found on other marketplaces.';
      document.querySelector('.container-fluid').appendChild(noResultsMsg);
    }
    
  } catch (error) {
    console.error('[PricePulse-Popup] Popup error:', error);
    showError('Failed to load price comparison data.');
  }
});

// Add retry button functionality
document.addEventListener('click', async function(e) {
  if (e.target.id === 'retry-detection' || e.target.closest('#retry-detection')) {
    console.log('[PricePulse-Popup] Retry button clicked');
    
    showLoading('Retrying product detection...');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Execute content script manually to re-extract product data
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          if (typeof window.performExtraction === 'function') {
            window.performExtraction();
          } else {
            console.log('[PricePulse] Content script not available for manual trigger');
          }
        }
      });
      
      // Wait a bit then check storage
      setTimeout(async () => {
        const storageKey = `product_${tab.id}`;
        const result = await chrome.storage.local.get([storageKey]);
        
        if (result[storageKey]) {
          location.reload(); // Reload popup to show data
        } else {
          showError('Still no product detected. Make sure you are on a product page.');
        }
      }, 3000);
      
    } catch (error) {
      console.error('[PricePulse-Popup] Retry error:', error);
      showError('Failed to retry detection.');
    }
  }
});

function showLoading(message = 'Searching for better prices...') {
  const loadingEl = document.getElementById('loading');
  const loadingText = loadingEl.querySelector('p');
  if (loadingText) {
    loadingText.textContent = message;
  }
  loadingEl.style.display = 'block';
  hideOtherSections(['loading']);
}

function showError(message) {
  document.getElementById('error-message').textContent = message;
  document.getElementById('error').style.display = 'block';
  hideOtherSections(['error']);
}

function showNoProduct() {
  document.getElementById('no-product').style.display = 'block';
  hideOtherSections(['no-product']);
}

function hideOtherSections(except) {
  const sections = ['loading', 'error', 'no-product', 'current-product', 'comparison-results'];
  sections.forEach(section => {
    if (!except.includes(section)) {
      document.getElementById(section).style.display = 'none';
    }
  });
}

function displayCurrentProduct(productData) {
  document.getElementById('current-image').src = productData.image || '';
  document.getElementById('current-title').textContent = productData.title || 'Unknown Product';
  document.getElementById('current-price').textContent = productData.price || 'Price not available';
  document.getElementById('current-site').textContent = getMarketplaceName(productData.marketplace);
  
  document.getElementById('current-product').style.display = 'block';
}

function displayComparisonResults(results, currentPrice) {
  const resultsListEl = document.getElementById('results-list');
  resultsListEl.innerHTML = '';
  
  const currentPriceNum = parsePrice(currentPrice);
  let bestPrice = currentPriceNum;
  let bestResult = null;
  
  results.forEach(result => {
    const resultPrice = parsePrice(result.price);
    if (resultPrice > 0 && resultPrice < bestPrice) {
      bestPrice = resultPrice;
      bestResult = result;
    }
    
    const resultEl = createResultElement(result, currentPriceNum);
    resultsListEl.appendChild(resultEl);
  });
  
  if (bestResult && bestPrice < currentPriceNum) {
    showBestDeal(bestResult, currentPriceNum - bestPrice);
  }
  
  document.getElementById('comparison-results').style.display = 'block';
  hideOtherSections(['current-product', 'comparison-results']);
}

function createResultElement(result, currentPrice) {
  const resultEl = document.createElement('div');
  const resultPrice = parsePrice(result.price);
  
  let priceClass = 'same';
  let savingsEl = '';
  
  if (resultPrice > 0) {
    if (resultPrice < currentPrice) {
      priceClass = 'lower';
      const savings = currentPrice - resultPrice;
      savingsEl = `<span class="badge bg-success ms-2">Save ${savings.toFixed(2)}</span>`;
      resultEl.classList.add('border-success');
    } else if (resultPrice > currentPrice) {
      priceClass = 'higher';
    }
  }
  
  resultEl.className = 'card mb-2';
  resultEl.innerHTML = `
    <div class="card-body p-2">
      <div class="row align-items-center">
        <div class="col-3 text-center">
          ${result.image ? `<img src="${result.image}" alt="Product Image" class="img-fluid rounded">` : '<i class="fas fa-image fa-2x text-muted"></i>'}
        </div>
        <div class="col-9">
          <h6 class="mb-1 small">${result.title}</h6>
          <div class="d-flex justify-content-between align-items-center">
            <div>
              ${getMarketplaceLogo(result.marketplace) ? `<img src="${getMarketplaceLogo(result.marketplace)}" alt="${getMarketplaceName(result.marketplace)} Logo" class="marketplace-logo-small me-1">` : ''}
              <span class="badge bg-secondary">${getMarketplaceName(result.marketplace)}</span>
            </div>
            <strong class="text-primary">${result.price}</strong>
            ${savingsEl}
          </div>
          <a href="${result.url}" target="_blank" class="btn btn-sm btn-outline-primary mt-1 w-100">
            View Deal <i class="fas fa-external-link-alt ms-1"></i>
          </a>
        </div>
      </div>
    </div>
  `;
  
  resultEl.addEventListener('click', (e) => {
    if (!e.target.closest('a')) { // Only open URL if not clicking on the link itself
      window.open(result.url, '_blank');
    }
  });
  
  return resultEl;
}

function showBestDeal(bestResult, savings) {
  const savingsInfo = document.getElementById('savings-info');
  savingsInfo.innerHTML = `
    Save ${savings.toFixed(2)} at ${getMarketplaceName(bestResult.marketplace)}
    <br><small>${bestResult.title}</small>
  `;
  document.getElementById('best-deal').style.display = 'block';
}

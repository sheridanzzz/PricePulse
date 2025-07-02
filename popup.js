document.addEventListener('DOMContentLoaded', async function() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const noProductEl = document.getElementById('no-product');
  const currentProductEl = document.getElementById('current-product');
  const comparisonResultsEl = document.getElementById('comparison-results');
  
  try {
    // Show loading state
    showLoading();
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we have stored product data for this tab
    const result = await chrome.storage.local.get([`product_${tab.id}`]);
    const productData = result[`product_${tab.id}`];
    
    if (!productData) {
      showNoProduct();
      return;
    }
    
    // Display current product
    displayCurrentProduct(productData);
    
    // Fetch price comparison data
    const comparisonData = await fetchPriceComparison(productData);
    
    if (comparisonData && comparisonData.length > 0) {
      displayComparisonResults(comparisonData, productData.price);
    } else {
      showError('No comparison data found for this product.');
    }
    
  } catch (error) {
    console.error('Popup error:', error);
    showError('Failed to load price comparison data.');
  }
});

function showLoading() {
  document.getElementById('loading').style.display = 'block';
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

function getMarketplaceName(marketplace) {
  const names = {
    'amazon': 'Amazon',
    'ebay': 'eBay',
    'walmart': 'Walmart',
    'target': 'Target'
  };
  return names[marketplace] || marketplace;
}

async function fetchPriceComparison(productData) {
  try {
    const response = await fetch('http://localhost:8000/compare-prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: productData.title,
        currentMarketplace: productData.marketplace,
        currentPrice: productData.price
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Price comparison fetch error:', error);
    return [];
  }
}

function displayComparisonResults(results, currentPrice) {
  const resultsListEl = document.getElementById('results-list');
  resultsListEl.innerHTML = '';
  
  // Parse current price for comparison
  const currentPriceNum = parsePrice(currentPrice);
  let bestPrice = currentPriceNum;
  let bestResult = null;
  
  results.forEach(result => {
    const resultPriceNum = parsePrice(result.price);
    if (resultPriceNum > 0 && resultPriceNum < bestPrice) {
      bestPrice = resultPriceNum;
      bestResult = result;
    }
    
    const resultEl = createResultElement(result, currentPriceNum);
    resultsListEl.appendChild(resultEl);
  });
  
  // Show best deal info if found
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
      savingsEl = `<span class="savings ms-2">Save $${savings.toFixed(2)}</span>`;
      resultEl.classList.add('best-price');
    } else if (resultPrice > currentPrice) {
      priceClass = 'higher';
    }
  }
  
  resultEl.className = 'result-item';
  resultEl.innerHTML = `
    <div class="row align-items-center">
      <div class="col-3">
        <img src="${result.image || ''}" alt="Product" class="img-fluid">
      </div>
      <div class="col-9">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge marketplace-badge bg-secondary">${getMarketplaceName(result.marketplace)}</span>
          <div class="text-end">
            <div class="price ${priceClass}">${result.price}${savingsEl}</div>
          </div>
        </div>
        <p class="mb-1 small">${result.title}</p>
        ${result.availability ? `<p class="availability mb-1">${result.availability}</p>` : ''}
        <a href="${result.url}" target="_blank" class="external-link">
          <i class="fas fa-external-link-alt me-1"></i>View on ${getMarketplaceName(result.marketplace)}
        </a>
      </div>
    </div>
  `;
  
  resultEl.addEventListener('click', () => {
    chrome.tabs.create({ url: result.url });
  });
  
  return resultEl;
}

function showBestDeal(bestResult, savings) {
  const savingsInfo = document.getElementById('savings-info');
  savingsInfo.innerHTML = `
    Save $${savings.toFixed(2)} at ${getMarketplaceName(bestResult.marketplace)}
    <br><small>${bestResult.title}</small>
  `;
  document.getElementById('best-deal').style.display = 'block';
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  // Extract numeric value from price string
  const match = priceStr.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

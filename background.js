chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'productDetected' && sender.tab) {
    const tabId = sender.tab.id;
    const productData = message.data;
    
    // Store product data in local storage, associated with the tab ID
    chrome.storage.local.set({ [`product_${tabId}`]: productData })
      .then(() => {
        console.log(`[PricePulse-Background] Product data stored for tab ${tabId}:`, productData);
        sendResponse({ status: 'received' });
      })
      .catch(error => {
        console.error(`[PricePulse-Background] Error storing product data for tab ${tabId}:`, error);
        sendResponse({ status: 'error', message: error.message });
      });
    
    // Keep the message channel open for sendResponse
    return true; 
  }
});

// Optional: Clear data when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`product_${tabId}`)
    .then(() => {
      console.log(`[PricePulse-Background] Cleared product data for closed tab ${tabId}`);
    })
    .catch(error => {
      console.error(`[PricePulse-Background] Error clearing product data for tab ${tabId}:`, error);
    });
});

// Optional: Clear data when the extension is reloaded/uninstalled
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear(() => {
    console.log('[PricePulse-Background] Cleared all stored data on install/update.');
  });
});

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
  const match = priceStr.match(/\d,\.\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

async function fetchPriceComparison(productData) {
  try {
    const response = await fetch('http://localhost:8000/compare-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: productData.title,
        currentMarketplace: productData.marketplace,
        currentPrice: productData.price
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return { results: data.results || [], error: null };
    } else {
      return { results: [], error: 'Server error' };
    }
  } catch (error) {
    console.error('[PricePulse-Background] Fetch error:', error);
    return { results: [], error: 'Failed to fetch comparison data' };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'productDetected' && sender.tab) {
    const tabId = sender.tab.id;
    const productData = message.data;
    
    // Store product data in local storage, associated with the tab ID
    chrome.storage.local.set({ [`product_${tabId}`]: productData })
      .then(() => {
        console.log(`[PricePulse-Background] Product data stored for tab ${tabId}:`, productData);
        sendResponse({ status: 'received' });
      })
      .catch(error => {
        console.error(`[PricePulse-Background] Error storing product data for tab ${tabId}:`, error);
        sendResponse({ status: 'error', message: error.message });
      });
    
    // Keep the message channel open for sendResponse
    return true; 
  } else if (message.action === 'fetchComparisonAndShowOverlay') {
    const productData = message.productData;
    const tabId = sender.tab.id;

    // Immediately show the overlay with product data and a loading state
    chrome.tabs.sendMessage(tabId, {
      action: 'showOverlay',
      productData: productData,
      comparisonResults: [], // No results yet
      error: null
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(`[PricePulse-Background] Error sending initial showOverlay message to tab ${tabId}:`, chrome.runtime.lastError.message);
      }
    });

    // Fetch comparison results asynchronously
    fetchPriceComparison(productData)
      .then(comparisonResponse => {
        // Send comparison results back to content script to update overlay
        console.log(`[PricePulse-Background] Sending updateOverlay message to tab ${tabId}`);
        chrome.tabs.sendMessage(tabId, {
          action: 'updateOverlay',
          productData: productData,
          comparisonResults: comparisonResponse.results,
          error: comparisonResponse.error
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(`[PricePulse-Background] Error sending updateOverlay message to tab ${tabId}:`, chrome.runtime.lastError.message);
          }
        });
      })
      .catch(error => {
        console.error('[PricePulse-Background] Error in fetchComparisonAndShowOverlay:', error);
        chrome.tabs.sendMessage(tabId, {
          action: 'updateOverlay',
          productData: productData,
          comparisonResults: [],
          error: error.message
        });
      });
    return true; // Indicates that the response will be sent asynchronously
  }
});

// Optional: Clear data when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`product_${tabId}`)
    .then(() => {
      console.log(`[PricePulse-Background] Cleared product data for closed tab ${tabId}`);
    })
    .catch(error => {
      console.error(`[PricePulse-Background] Error clearing product data for tab ${tabId}:`, error);
    });
});

// Optional: Clear data when the extension is reloaded/uninstalled
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear(() => {
    console.log('[PricePulse-Background] Cleared all stored data on install/update.');
  });
});

console.log('[PricePulse-Background] Service Worker started');
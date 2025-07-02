# Chrome Extension Troubleshooting Guide

## Quick Fix Steps

### 1. Reload the Extension
After making code changes, you need to reload the extension:

1. Go to `chrome://extensions/`
2. Find "Price Comparison Extension"
3. Click the refresh/reload icon ↻ next to the extension
4. This reloads the code changes

### 2. Check Extension Permissions
1. In `chrome://extensions/`, click "Details" on the extension
2. Make sure "Allow on all sites" is enabled
3. Or manually add amazon.com.au to allowed sites

### 3. Debug the Content Script
1. Go to any Amazon product page (like the Lenovo Legion Go you showed)
2. Open Chrome DevTools (F12)
3. Go to the "Console" tab
4. Look for debug messages from the extension
5. You should see logs like:
   - "Detected marketplace: amazon"
   - "Extracted title: [product name]"
   - "Extracted price: [price]"

### 4. Test Different Product Pages
Try these test pages to see if detection works:
- Amazon US: Any /dp/ URL
- Amazon AU: Any product page
- eBay: Any /itm/ URL

### 5. Check Server Connection
1. Make sure the Python server is running: `python price_server.py`
2. Test server: Visit `http://localhost:8000/health`
3. Should show: `{"service":"Price Comparison Server","status":"healthy"}`

## Common Issues & Solutions

### "No Product Detected" Error
**Cause**: Content script not detecting product elements
**Solution**: 
1. Reload extension
2. Refresh the product page
3. Check browser console for debug messages

### Extension Icon Not Showing Badge
**Cause**: Content script not running or not finding products
**Solution**:
1. Check that you're on a supported marketplace
2. Look for console errors
3. Reload extension and page

### Price Comparison Not Loading
**Cause**: Backend server not running or connection blocked
**Solution**:
1. Start server: `python price_server.py`
2. Check firewall isn't blocking port 8000
3. Test server endpoint directly

### Australian Amazon Not Working
**Fixed**: Updated extension to support amazon.com.au and other international domains

## Debug Console Commands

Run these in the browser console on a product page:

```javascript
// Check if content script is loaded
console.log('Content script loaded:', typeof extractProductData !== 'undefined');

// Test product detection
if (typeof extractProductData !== 'undefined') {
  const data = extractProductData();
  console.log('Product data:', data);
}

// Check marketplace detection
console.log('Current hostname:', window.location.hostname);
console.log('Current pathname:', window.location.pathname);
```

## What Changed (Latest Updates)

✅ **Fixed Australian Amazon Support**
- Added amazon.com.au domain support
- Updated URL matching patterns
- Added international domain detection

✅ **Improved Product Detection**
- Added more price selectors
- Enhanced title detection
- Better debugging output

✅ **Broader Content Script Matching**
- Now runs on all Amazon pages (not just specific URL patterns)
- Better marketplace detection logic

## Next Steps After Reloading

1. **Reload the extension** in chrome://extensions/
2. **Go back to your Amazon AU product page**
3. **Open browser console** (F12 → Console tab)
4. **Refresh the page** to trigger the content script
5. **Look for debug messages** in console
6. **Click the extension icon** to test the popup

The extension should now detect the Lenovo Legion Go product properly!
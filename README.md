# Price Comparison Chrome Extension

A powerful Chrome extension that automatically compares product prices across Amazon, eBay, Walmart, and Target to help you find the best deals.

## Features

- **Automatic Product Detection**: Detects products on Amazon, eBay, Walmart, and Target
- **Real-time Price Comparison**: Searches other marketplaces for better prices
- **Savings Calculation**: Shows exactly how much you can save
- **Clean Interface**: Beautiful popup with easy-to-read results
- **Best Deal Highlighting**: Automatically identifies the lowest prices

## Installation

### Step 1: Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" button
4. Select the folder containing this extension's files
5. The extension icon should now appear in your Chrome toolbar

### Step 2: Start the Backend Server

The extension requires a local server to perform price scraping:

1. Make sure Python is installed on your system
2. The server should start automatically, but if needed, you can run:
   ```bash
   python price_server.py
   ```
3. The server will run on `http://localhost:8000`

## How to Use

### 1. Browse Products
- Visit any product page on:
  - Amazon (amazon.com)
  - eBay (ebay.com)
  - Walmart (walmart.com)
  - Target (target.com)

### 2. Product Detection
- The extension automatically detects product information
- You'll see a blue badge with "!" appear on the extension icon
- This indicates a product was found and is ready for comparison

### 3. Compare Prices
- Click the extension icon to open the price comparison popup
- The current product information will be displayed
- The extension will search other marketplaces for the same or similar products
- Results will show with price comparisons and potential savings

### 4. View Results
- **Green prices**: Better deals than the current price
- **Red prices**: Higher prices than the current price
- **Savings badges**: Show exactly how much you can save
- **Best Deal Alert**: Highlights the biggest savings opportunity

### 5. Visit Better Deals
- Click on any result to open that product page in a new tab
- Use the "View on [Marketplace]" links to navigate directly to better deals

## Test the Extension

You can test the extension using the included test page:

1. Open `test_extension.html` in Chrome
2. This simulates an Amazon product page
3. Click the extension icon to see the price comparison in action

## Supported Marketplaces

| Marketplace | Product Detection | Price Comparison |
|-------------|------------------|------------------|
| Amazon      | ✅ Yes           | ✅ Yes           |
| eBay        | ✅ Yes           | ✅ Yes           |
| Walmart     | ✅ Yes           | ✅ Yes           |
| Target      | ✅ Yes           | ✅ Yes           |

## Technical Details

### Architecture
- **Frontend**: Chrome Extension (Manifest V3)
- **Backend**: Python Flask server with web scraping
- **Data Extraction**: Trafilatura for content extraction
- **Storage**: Chrome local storage for temporary data

### API Endpoints
- `GET /` - Server information
- `GET /health` - Health check
- `POST /compare-prices` - Compare prices across marketplaces
- `GET /marketplaces` - List supported marketplaces

### Privacy & Security
- No personal data is collected or stored
- Product information is only stored temporarily in local browser storage
- All price comparisons are performed locally on your machine
- No data is sent to third parties

## Troubleshooting

### Extension Not Working
1. Check that Developer mode is enabled in Chrome extensions
2. Ensure the extension is loaded and enabled
3. Verify the backend server is running on port 8000

### No Price Comparisons
1. Make sure you're on a supported marketplace product page
2. Check that the extension detected the product (blue badge should appear)
3. Verify the server is running: visit `http://localhost:8000/health`

### Server Issues
1. Check that Python and Flask are installed
2. Ensure port 8000 is not blocked by firewall
3. Look for error messages in the server console

## Development

### Project Structure
```
├── manifest.json          # Extension configuration
├── popup.html/css/js      # Extension popup interface
├── content.js             # Product detection script
├── background.js          # Extension background service
├── price_server.py        # Flask backend server
├── price_scraper.py       # Web scraping logic
├── test_extension.html    # Test page
└── icons/                 # Extension icons
```

### Contributing
This extension can be extended to support additional marketplaces by:
1. Adding new marketplace configurations in `content.js`
2. Adding scraping patterns in `price_scraper.py`
3. Updating the manifest.json with new host permissions

## License
This project is provided as-is for educational and personal use.
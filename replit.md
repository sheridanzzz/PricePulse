# Price Comparison Browser Extension

## Overview

This is a browser extension that helps users find the best deals by comparing product prices across multiple marketplaces including Amazon, eBay, Walmart, and Target. The extension consists of a Chrome extension frontend and a Python-based backend service for price scraping and comparison.

## System Architecture

The system follows a client-server architecture with two main components:

1. **Chrome Extension (Frontend)**: Handles product detection, user interface, and communication with the backend
2. **Python Backend Service**: Performs web scraping and price comparison across marketplaces

### Frontend Architecture
- **Manifest V3 Chrome Extension** with service worker pattern
- **Content Scripts** for product data extraction from marketplace pages
- **Popup Interface** built with HTML, CSS, and JavaScript using Bootstrap for styling
- **Background Service Worker** for cross-tab communication and badge management

### Backend Architecture
- **Flask REST API** serving price comparison endpoints
- **Web Scraping Module** using Trafilatura for content extraction
- **Price Extraction Logic** with regex patterns for different marketplaces

## Key Components

### Chrome Extension Components

1. **manifest.json**: Extension configuration defining permissions, content scripts, and host permissions for major marketplaces
2. **background.js**: Service worker handling extension lifecycle, badge updates, and inter-component communication
3. **content.js**: Product detection and extraction logic for each supported marketplace
4. **popup.html/css/js**: User interface for displaying current product and price comparison results

### Backend Components

1. **price_server.py**: Flask application with REST endpoints for health checks and price comparison
2. **price_scraper.py**: Core scraping logic with marketplace-specific configurations and price extraction patterns

## Data Flow

1. User navigates to a product page on a supported marketplace
2. Content script detects product information (title, price, image) and sends to background script
3. Background script updates extension badge and stores product data locally
4. User clicks extension icon to open popup
5. Popup retrieves stored product data and sends comparison request to backend API
6. Backend scrapes other marketplaces for similar products and extracts pricing
7. Results are returned and displayed in popup with best price highlighting

## External Dependencies

### Frontend Dependencies
- **Bootstrap 5.1.3**: UI framework for responsive design
- **Font Awesome 6.0.0**: Icon library for enhanced visual elements
- **Chrome APIs**: Extension APIs for tabs, storage, and scripting

### Backend Dependencies
- **Flask**: Web framework for REST API
- **Flask-CORS**: Cross-origin resource sharing support
- **Trafilatura**: Web content extraction library for scraping

## Deployment Strategy

### Development Setup
- Chrome extension loaded in developer mode
- Python backend runs locally on port 8000 (configured in manifest host_permissions)
- Local storage used for temporary product data caching

### Production Considerations
- Backend should be deployed to a cloud service (AWS, GCP, Heroku)
- Extension requires Chrome Web Store publication for distribution
- API endpoints need to be updated in extension configuration for production URLs

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Status

The Price Comparison Chrome Extension is **fully functional and ready to use**. All components are working correctly:

- ✅ Chrome Extension with product detection
- ✅ Flask backend server running on port 8000
- ✅ Web scraping functionality operational
- ✅ Price comparison API responding correctly
- ✅ Clean popup interface with savings calculations

## Recent Changes

### July 02, 2025 - Extension Completed
- Built complete Chrome extension with Manifest V3 support
- Implemented product detection for Amazon, eBay, Walmart, Target
- Created Flask backend server with price scraping capabilities
- Added comprehensive popup interface with Bootstrap styling
- Implemented real-time price comparison across marketplaces
- Fixed server endpoint configuration (added root route)
- Successfully tested price comparison API (found iPhone 15 for $474.99 vs $799.00)
- Created test page and comprehensive documentation

## Changelog

- July 02, 2025: Complete price comparison extension built and tested
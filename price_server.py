from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from price_scraper import search_product_prices

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/', methods=['GET'])
def home():
    """Root endpoint with API information."""
    return jsonify({
        'service': 'Price Comparison Server',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'compare_prices': '/compare-prices',
            'search': '/search',
            'marketplaces': '/marketplaces'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'Price Comparison Server'
    })

@app.route('/compare-prices', methods=['POST'])
def compare_prices():
    """Compare prices across marketplaces."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No JSON data provided'
            }), 400
        
        title = data.get('title')
        current_marketplace = data.get('currentMarketplace')
        current_price = data.get('currentPrice')
        
        if not title:
            return jsonify({
                'error': 'Product title is required'
            }), 400
        
        # Perform price comparison
        results = search_product_prices(
            product_title=title,
            current_marketplace=current_marketplace,
            current_price=current_price
        )
        
        return jsonify(results)
        
    except Exception as e:
        print(f"Error in compare_prices: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/search', methods=['POST'])
def search_products():
    """Search for products on specific marketplace."""
    try:
        data = request.get_json()
        
        query = data.get('query')
        marketplace = data.get('marketplace', 'amazon')
        
        if not query:
            return jsonify({
                'error': 'Search query is required'
            }), 400
        
        from price_scraper import PriceScraper
        scraper = PriceScraper()
        
        results = scraper.search_marketplace(query, marketplace)
        
        return jsonify({
            'query': query,
            'marketplace': marketplace,
            'results': results
        })
        
    except Exception as e:
        print(f"Error in search_products: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/marketplaces', methods=['GET'])
def get_marketplaces():
    """Get list of supported marketplaces."""
    return jsonify({
        'marketplaces': [
            {
                'id': 'amazon',
                'name': 'Amazon US',
                'supported': True
            },
            {
                'id': 'amazon_au',
                'name': 'Amazon AU',
                'supported': True
            },
            {
                'id': 'ebay',
                'name': 'eBay US',
                'supported': True
            },
            {
                'id': 'ebay_au',
                'name': 'eBay AU',
                'supported': True
            },
            {
                'id': 'walmart',
                'name': 'Walmart',
                'supported': True
            },
            {
                'id': 'target',
                'name': 'Target US',
                'supported': True
            },
            {
                'id': 'target_au',
                'name': 'Target AU',
                'supported': True
            }
        ]
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('DEBUG', 'false').lower() == 'true'
    
    print(f"Starting Price Comparison Server on port {port}")
    print(f"Debug mode: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )

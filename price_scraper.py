import trafilatura
import re
import json
from urllib.parse import quote_plus, urljoin
import time
import random


def get_website_text_content(url: str) -> str:
    """
    Extract main text content from a website using trafilatura.
    Returns cleaned text content that's easier to process.
    """
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded)
            return text if text else ""
        return ""
    except Exception as e:
        print(f"Error extracting content from {url}: {e}")
        return ""


class PriceScraper:
    def __init__(self):
        self.marketplaces = {
            'amazon': {
                'search_url': 'https://www.amazon.com/s?k={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*',
                    r'Currently:\s*\$[\d,]+\.?\d*'
                ]
            },
            'ebay': {
                'search_url': 'https://www.ebay.com/sch/i.html?_nkw={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'US\s*\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*'
                ]
            },
            'walmart': {
                'search_url': 'https://www.walmart.com/search?q={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'current price\s*\$[\d,]+\.?\d*',
                    r'was\s*\$[\d,]+\.?\d*'
                ]
            },
            'target': {
                'search_url': 'https://www.target.com/s?searchTerm={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'current price\s*\$[\d,]+\.?\d*',
                    r'reg\s*\$[\d,]+\.?\d*'
                ]
            }
        }
    
    def clean_product_title(self, title: str) -> str:
        """Clean product title for better search results."""
        if not title:
            return ""
        
        # Remove common marketplace-specific terms
        cleaned = re.sub(r'\b(amazon|ebay|walmart|target)\b', '', title, flags=re.IGNORECASE)
        
        # Remove extra whitespace and special characters
        cleaned = re.sub(r'[^\w\s-]', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Take only the first part of very long titles
        words = cleaned.split()
        if len(words) > 8:
            cleaned = ' '.join(words[:8])
        
        return cleaned
    
    def extract_prices_from_text(self, text: str, marketplace: str) -> list:
        """Extract prices from text content using regex patterns."""
        if not text or marketplace not in self.marketplaces:
            return []
        
        prices = []
        selectors = self.marketplaces[marketplace]['price_selectors']
        
        for pattern in selectors:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Clean and validate price
                price_str = re.sub(r'[^\d.,]', '', match)
                if price_str and '.' in price_str:
                    try:
                        price_value = float(price_str.replace(',', ''))
                        if 1 <= price_value <= 10000:  # Reasonable price range
                            prices.append({
                                'price': f"${price_value:.2f}",
                                'raw_text': match
                            })
                    except ValueError:
                        continue
        
        return prices
    
    def extract_product_info_from_search(self, text: str, query: str) -> list:
        """Extract product information from search results text."""
        products = []
        
        # Split text into sections (rough estimation for different products)
        sections = text.split('\n\n')
        
        for section in sections[:5]:  # Limit to first 5 products
            if len(section) < 50:  # Skip very short sections
                continue
            
            # Look for product titles (lines with query terms)
            lines = section.split('\n')
            product_title = None
            
            for line in lines:
                # Check if line contains query terms and looks like a title
                query_words = query.lower().split()
                line_lower = line.lower()
                
                if (any(word in line_lower for word in query_words) and 
                    len(line) > 20 and len(line) < 200):
                    product_title = line.strip()
                    break
            
            if not product_title:
                continue
            
            # Extract prices from this section
            prices = []
            price_patterns = [
                r'\$[\d,]+\.?\d*',
                r'Price:\s*\$[\d,]+\.?\d*',
                r'[\d,]+\.?\d*\s*dollars?'
            ]
            
            for pattern in price_patterns:
                matches = re.findall(pattern, section, re.IGNORECASE)
                for match in matches:
                    price_str = re.sub(r'[^\d.,]', '', match)
                    if price_str:
                        try:
                            price_value = float(price_str.replace(',', ''))
                            if 1 <= price_value <= 10000:
                                prices.append(f"${price_value:.2f}")
                                break
                        except ValueError:
                            continue
                if prices:
                    break
            
            if prices:
                products.append({
                    'title': product_title,
                    'price': prices[0],
                    'availability': 'Available'
                })
        
        return products
    
    def search_marketplace(self, query: str, marketplace: str, exclude_marketplace: str = None) -> list:
        """Search for products on a specific marketplace."""
        if marketplace == exclude_marketplace:
            return []
        
        if marketplace not in self.marketplaces:
            return []
        
        try:
            # Clean query for search
            clean_query = self.clean_product_title(query)
            if not clean_query:
                return []
            
            # Build search URL
            search_url = self.marketplaces[marketplace]['search_url'].format(
                query=quote_plus(clean_query)
            )
            
            print(f"Searching {marketplace}: {search_url}")
            
            # Add random delay to avoid rate limiting
            time.sleep(random.uniform(1, 3))
            
            # Get search results content
            content = get_website_text_content(search_url)
            
            if not content:
                print(f"No content retrieved from {marketplace}")
                return []
            
            # Extract product information
            products = self.extract_product_info_from_search(content, clean_query)
            
            # Add marketplace info to products
            for product in products:
                product['marketplace'] = marketplace
                product['url'] = search_url
                product['image'] = ''  # Would need more sophisticated extraction
            
            print(f"Found {len(products)} products on {marketplace}")
            return products[:3]  # Limit to top 3 results
            
        except Exception as e:
            print(f"Error searching {marketplace}: {e}")
            return []
    
    def compare_prices(self, product_title: str, current_marketplace: str = None, current_price: str = None) -> dict:
        """Compare prices across all supported marketplaces."""
        results = {
            'query': product_title,
            'current_marketplace': current_marketplace,
            'current_price': current_price,
            'results': [],
            'timestamp': time.time()
        }
        
        # Search all marketplaces except the current one
        for marketplace in self.marketplaces.keys():
            if marketplace != current_marketplace:
                products = self.search_marketplace(
                    product_title, 
                    marketplace, 
                    current_marketplace
                )
                results['results'].extend(products)
        
        # Sort results by price (if available)
        def sort_key(product):
            try:
                price_str = product.get('price', '').replace('$', '').replace(',', '')
                return float(price_str) if price_str else float('inf')
            except:
                return float('inf')
        
        results['results'].sort(key=sort_key)
        
        return results


def search_product_prices(product_title: str, current_marketplace: str = None, current_price: str = None) -> dict:
    """Main function to search for product prices across marketplaces."""
    scraper = PriceScraper()
    return scraper.compare_prices(product_title, current_marketplace, current_price)


# Example usage
if __name__ == "__main__":
    # Test the scraper
    test_query = "iPhone 14 Pro 128GB"
    results = search_product_prices(test_query, "amazon", "$999.00")
    print(json.dumps(results, indent=2))

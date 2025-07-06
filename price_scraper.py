import requests
from bs4 import BeautifulSoup
import re
import json
from urllib.parse import quote_plus, urljoin
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Path to your ChromeDriver executable
CHROMEDRIVER_PATH = '/Users/sheridangomes/PricePulse/chromedriver' # Adjust this path if you placed it elsewhere

def get_website_text_content(url: str, use_selenium: bool = False) -> str:
    """
    Extract main text content from a website using requests and BeautifulSoup.
    Returns cleaned text content that's easier to process.
    """
    try:
        if use_selenium:
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("window-size=1920x1080")
            service = Service(CHROMEDRIVER_PATH)
            driver = webdriver.Chrome(service=service, options=options)
            driver.get(url)
            # Wait for the body to be present
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            content = driver.page_source
            driver.quit()
            return content
        else:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return response.text
            return ""
    except Exception as e:
        print(f"Error extracting content from {url}: {e}")
        return ""


class PriceScraper:
    def __init__(self):
        self.marketplaces = {
            'amazon': {
                'base_url': 'https://www.amazon.com',
                'search_url': 'https://www.amazon.com/s?k={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*',
                    r'Currently:\s*\$[\d,]+\.?\d*'
                ]
            },
            'amazon_au': {
                'base_url': 'https://www.amazon.com.au',
                'search_url': 'https://www.amazon.com.au/s?k={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'AUD\s*\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*',
                    r'Currently:\s*\$[\d,]+\.?\d*'
                ]
            },
            'ebay': {
                'base_url': 'https://www.ebay.com',
                'search_url': 'https://www.ebay.com/sch/i.html?_nkw={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'US\s*\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*'
                ]
            },
            'ebay_au': {
                'base_url': 'https://www.ebay.com.au',
                'search_url': 'https://www.ebay.com.au/sch/i.html?_nkw={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'AU\s*\$[\d,]+\.?\d*',
                    r'AUD\s*\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*'
                ]
            },
            'walmart': {
                'base_url': 'https://www.walmart.com',
                'search_url': 'https://www.walmart.com/search?q={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'current price\s*\$[\d,]+\.?\d*',
                    r'was\s*\$[\d,]+\.?\d*'
                ]
            },
            'target': {
                'base_url': 'https://www.target.com',
                'search_url': 'https://www.target.com/s?searchTerm={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'current price\s*\$[\d,]+\.?\d*',
                    r'reg\s*\$[\d,]+\.?\d*'
                ]
            },
            'target_au': {
                'base_url': 'https://www.target.com.au',
                'search_url': 'https://www.target.com.au/s?searchTerm={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'current price\s*\$[\d,]+\.?\d*',
                    r'was\s*\$[\d,]+\.?\d*'
                ]
            },
            'jbhifi_au': {
                'base_url': 'https://www.jbhifi.com.au',
                'search_url': 'https://www.jbhifi.com.au/search?query={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'AUD\s*\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*',
                    r'Now:\s*\$[\d,]+\.?\d*'
                ]
            },
            'thegoodguys_au': {
                'base_url': 'https://www.thegoodguys.com.au',
                'search_url': 'https://www.thegoodguys.com.au/search?q={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'AUD\s*\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*'
                ]
            },
            'mydeal_au': {
                'base_url': 'https://www.mydeal.com.au',
                'search_url': 'https://www.mydeal.com.au/search?q={query}',
                'price_selectors': [
                    r'\$[\d,]+\.?\d*',
                    r'AUD\s*\$[\d,]+\.?\d*',
                    r'Price:\s*\$[\d,]+\.?\d*'
                ]
            }
        }
    
    def clean_product_title(self, title: str) -> str:
        """Clean product title for better search results."""
        if not title:
            return ""
        
        # Remove common marketplace-specific terms and generic descriptive words
        stop_words = ['gaming', 'monitor', 'inches', 'curved', 'ultra', 'hd', 'hz', 'ms', 'amd', 'freesync', 'nvidia', 'g-sync', 'adaptive', 'sync', 'technology', 'oled', 'qhd', 'uhd', 'display', 'studio', 'portable', 'with', 'for', 'by', 'gen', 'inch']
        cleaned = re.sub(r'\b(amazon|ebay|walmart|target)\b', '', title, flags=re.IGNORECASE)
        
        words = cleaned.split()
        cleaned_words = [word for word in words if word.lower() not in stop_words]
        cleaned = ' '.join(cleaned_words)

        # Remove extra whitespace and special characters
        cleaned = re.sub(r'[^\w\s-]', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
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
    
    def extract_product_info_from_search(self, html_content: str, query: str, marketplace: str) -> list:
        """Extract product information from search results HTML content."""
        products = []
        soup = BeautifulSoup(html_content, 'html.parser', from_encoding="utf-8")

        # Common selectors for product containers
        product_containers = soup.find_all(['div', 'li', 'article'], class_=re.compile(r'product-card|product-item|search-result|item-card', re.I))

        if not product_containers:
            print(f"No generic product containers found for query: {query} on {marketplace}")
            return []

        for container in product_containers:
            title_tag = container.find(['h2', 'h3', 'h4', 'a'], class_=re.compile(r'product-title|item-title|title', re.I))
            price_tag = container.find(['span', 'div'], class_=re.compile(r'price|product-price|item-price', re.I))
            link_tag = container.find('a', href=True)

            title = title_tag.get_text(strip=True) if title_tag else None
            price = price_tag.get_text(strip=True) if price_tag else None
            url = urljoin(self.marketplaces[marketplace]['base_url'], link_tag['href']) if link_tag else None

            if title and price and url:
                products.append({
                    'title': title,
                    'price': price,
                    'url': url,
                    'image': ''  # Placeholder
                })
        return products
    
    def _scrape_jbhifi(self, html_content: str) -> list:
        """Scrape product information specifically from JB Hi-Fi search results."""
        products = []
        soup = BeautifulSoup(html_content, 'html.parser', from_encoding="utf-8")
        
        # Look for product tiles using the data-testid attribute
        product_tiles = soup.find_all('div', attrs={'data-testid': 'product-card-content'})
        
        if not product_tiles:
            print("No product tiles found for JB Hi-Fi with data-testid='product-card-content'.")
            print(f"Raw HTML content for JB Hi-Fi (first 1000 chars):\n{html_content[:1000]}") # Debug print

        for tile in product_tiles:
            title_tag = tile.find('div', attrs={'data-testid': 'product-card-title'})
            price_tag = tile.find('span', class_='PriceTag_actual__1eb7mu916')
            link_tag = tile.find('a', class_='ProductCard_imageLink', href=True)
            image_tag = tile.find('div', attrs={'data-testid': 'product-card-image-base'}).find('img')
            
            title = title_tag.get_text(strip=True) if title_tag else None
            price = price_tag.get_text(strip=True) if price_tag else None
            url = urljoin('https://www.jbhifi.com.au', link_tag['href']) if link_tag else None
            image_url = image_tag['src'] if image_tag and 'src' in image_tag.attrs else ''

            if title and price and url:
                products.append({
                    'title': title,
                    'price': price,
                    'url': url,
                    'image': image_url
                })
        return products

    def _scrape_thegoodguys(self, html_content: str) -> list:
        """Scrape product information specifically from The Good Guys search results."""
        products = []
        soup = BeautifulSoup(html_content, 'html.parser', from_encoding="utf-8")
        
        product_tiles = soup.find_all('article', attrs={'data-testid': 'product-card'})
        
        if not product_tiles:
            print("No product tiles found for The Good Guys.")

        for tile in product_tiles:
            title_tag = tile.find('h4', class_='_title_1pa96_41')
            price_tag = tile.find('span', attrs={'data-price': 'true', 'data-testid': 'product-card-price-section-price'})
            link_tag = tile.find('a', class_='_imageLink_1pa96_24', href=True)
            image_tag = tile.find('a', class_='_imageLink_1pa96_24').find('img')
            
            title = title_tag.get_text(strip=True) if title_tag else None
            price = price_tag.get_text(strip=True) if price_tag else None
            url = urljoin('https://www.thegoodguys.com.au', link_tag['href']) if link_tag else None
            image_url = image_tag['src'] if image_tag and 'src' in image_tag.attrs else ''

            if title and price and url:
                products.append({
                    'title': title,
                    'price': price,
                    'url': url,
                    'image': image_url
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
            if marketplace in ['jbhifi_au', 'thegoodguys_au', 'target_au', 'amazon', 'target', 'mydeal_au']:
                content = get_website_text_content(search_url, use_selenium=True)
            else:
                content = get_website_text_content(search_url)

            if not content:
                print(f"No content retrieved from {marketplace}")
                return []

            # Extract product information based on marketplace
            if marketplace == 'jbhifi_au':
                products = self._scrape_jbhifi(content)
            elif marketplace == 'thegoodguys_au':
                products = self._scrape_thegoodguys(content)
            else:
                products = self.extract_product_info_from_search(content, clean_query, marketplace)

            # Add marketplace info to products
            for product in products:
                product['marketplace'] = marketplace
                # The URL is already absolute if extracted by _scrape_jbhifi or _scrape_thegoodguys or extract_product_info_from_search
                # If not, it needs to be made absolute here.
                if not product.get('url') or not product['url'].startswith(('http://', 'https://')):
                    product['url'] = urljoin(self.marketplaces[marketplace]['base_url'], product.get('url', ''))
                product['image'] = ''  # Placeholder, needs more sophisticated extraction

            print(f"Found {len(products)} products on {marketplace}")
            return products[:3]  # Limit to top 3 results
            
        except Exception as e:
            print(f"Error searching {marketplace}: {e}")
            return []
    
    def get_relevant_marketplaces(self, current_marketplace: str = None) -> list:
        """Get relevant marketplaces to search based on current marketplace region."""
        if not current_marketplace:
            return list(self.marketplaces.keys())
        
        # If user is on Australian site, prioritize Australian marketplaces
        if current_marketplace.endswith('_au'):
            au_marketplaces = [k for k in self.marketplaces.keys() if k.endswith('_au')]
            us_marketplaces = [k for k in self.marketplaces.keys() if not k.endswith('_au') and '_' not in k]
            return au_marketplaces + us_marketplaces
        
        # If user is on US site, prioritize US marketplaces
        elif current_marketplace in ['amazon', 'ebay', 'walmart', 'target']:
            us_marketplaces = [k for k in self.marketplaces.keys() if not '_' in k]
            au_marketplaces = [k for k in self.marketplaces.keys() if k.endswith('_au')]
            return us_marketplaces + au_marketplaces
        
        # Default: return all marketplaces
        return list(self.marketplaces.keys())

    def compare_prices(self, product_title: str, current_marketplace: str = None, current_price: str = None) -> dict:
        """Compare prices across all supported marketplaces."""
        results = {
            'query': product_title,
            'current_marketplace': current_marketplace,
            'current_price': current_price,
            'results': [],
            'timestamp': time.time()
        }
        
        # Get relevant marketplaces to search
        relevant_marketplaces = [m for m in self.get_relevant_marketplaces(current_marketplace) if m not in ['ebay', 'ebay_au', 'walmart', 'mydeal_au']]
        
        # Search relevant marketplaces except the current one
        for marketplace in relevant_marketplaces:
            if marketplace != current_marketplace:
                products = self.search_marketplace(
                    product_title, 
                    marketplace, 
                    current_marketplace
                )
                print(f"Raw products found for {marketplace}: {products}") # Debug print
                # Find the best match from the scraped products for this marketplace
                best_match_for_marketplace = self._find_best_match(products, product_title)
                print(f"Best match for {marketplace}: {best_match_for_marketplace}") # Debug print
                results['results'].extend(best_match_for_marketplace)
        
        print(f"Final results before returning: {results['results']}") # Debug print
        # Sort results by price (if available)
        def sort_key(product):
            try:
                price_str = product.get('price', '').replace('$', '').replace(',', '')
                return float(price_str) if price_str else float('inf')
            except:
                return float('inf')
        
        results['results'].sort(key=sort_key)
        
        return results

    def _find_best_match(self, products: list, query: str) -> list:
        """Finds the best matching product from a list based on query similarity."""
        if not products:
            return []

        # Simple approach: prioritize exact title match or high similarity
        best_match = None
        highest_similarity = 0.0

        cleaned_query = self.clean_product_title(query) # Clean the query once
        print(f"_find_best_match: Cleaned Query: {cleaned_query}") # Debug print

        for product in products:
            product_title = self.clean_product_title(product.get('title', '')) # Clean product title
            print(f"_find_best_match: Comparing with Product Title: {product_title}") # Debug print

            # Prioritize exact match
            if cleaned_query == product_title:
                print(f"_find_best_match: Exact match found: {product_title}") # Debug print
                return [product] # Return immediately if exact match found

            # Calculate similarity (e.g., using Jaccard index or simple word overlap)
            # For simplicity, let's use word overlap for now
            query_words = set(cleaned_query.split())
            product_words = set(product_title.split())
            
            common_words = len(query_words.intersection(product_words))
            total_words = len(query_words.union(product_words))
            
            if total_words > 0:
                similarity = common_words / total_words
            else:
                similarity = 0.0
            print(f"_find_best_match: Similarity: {similarity}") # Debug print

            if similarity > highest_similarity:
                highest_similarity = similarity
                best_match = product
        
        print(f"_find_best_match: Best match found (before threshold): {best_match} with similarity {highest_similarity}") # Debug print
        if best_match and highest_similarity >= 0.3: # Lowered threshold for testing
            return [best_match]
        else:
            return [] # No good match found


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

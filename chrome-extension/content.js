// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getProductInfo") {
        // Extract product information from the page
        const productInfo = {
            title: document.title || "Unknown Product",
            description: getProductDescription(),
            brand: getProductBrand(),
            price: getProductPrice(),
            category: getProductCategory(),
            url: window.location.href
        };
        
        console.log('Extracted product info:', productInfo);
        sendResponse(productInfo);
    }
    return true; // Keep the message channel open for async response
});

// Helper functions to extract product information
function getProductDescription() {
    // Try different common selectors for product descriptions
    const selectors = [
        'meta[name="description"]',
        '.product-description',
        '#productDescription',
        '.description',
        '[data-testid="product-description"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element.content || element.textContent || element.innerText;
        }
    }

    // Fallback: get first paragraph or return empty
    const firstParagraph = document.querySelector('p');
    return firstParagraph ? firstParagraph.textContent : "No description available";
}

function getProductBrand() {
    // Try different common selectors for brand names
    const selectors = [
        'meta[property="product:brand"]',
        '.brand',
        '[data-testid="brand"]',
        '.product-brand'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element.content || element.textContent || element.innerText;
        }
    }

    return "Unknown Brand";
}

function getProductPrice() {
    // Try different common selectors for prices
    const selectors = [
        'meta[property="product:price:amount"]',
        '.price',
        '.product-price',
        '[data-testid="price"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const priceText = element.content || element.textContent || element.innerText;
            // Extract numbers from price text
            const price = priceText.match(/[\d,.]+/);
            return price ? price[0] : "0.00";
        }
    }

    return "0.00";
}

function getProductCategory() {
    // Try different common selectors for categories
    const selectors = [
        'meta[property="product:category"]',
        '.category',
        '.breadcrumb',
        '[data-testid="category"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element.content || element.textContent || element.innerText;
        }
    }

    return "General";
} 
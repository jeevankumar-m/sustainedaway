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
            url: window.location.href,
            reviews: getProductReviews(),
            specifications: getProductSpecifications()
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
        '[data-testid="product-description"]',
        '#feature-bullets',
        '.product-description-content'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const content = element.content || element.textContent || element.innerText;
            if (content && content.trim().length > 0) {
                return content.trim();
            }
        }
    }

    // Fallback: get first paragraph or return empty
    const firstParagraph = document.querySelector('p');
    return firstParagraph ? firstParagraph.textContent.trim() : "No description available";
}

function getProductBrand() {
    // Try different common selectors for brand names
    const selectors = [
        'meta[property="product:brand"]',
        '.brand',
        '[data-testid="brand"]',
        '.product-brand',
        '#bylineInfo',
        '.product-brand-name',
        '.brand-name'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const content = element.content || element.textContent || element.innerText;
            if (content && content.trim().length > 0) {
                return content.trim();
            }
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
        '[data-testid="price"]',
        '.a-price-whole',
        '.product-price-value',
        '.price-value'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const priceText = element.content || element.textContent || element.innerText;
            // Extract numbers from price text
            const price = priceText.match(/[\d,.]+/);
            if (price) {
                return price[0].replace(/,/g, '');
            }
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
        '[data-testid="category"]',
        '.product-category',
        '.category-path',
        '#wayfinding-breadcrumbs'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const content = element.content || element.textContent || element.innerText;
            if (content && content.trim().length > 0) {
                return content.trim();
            }
        }
    }

    return "General";
}

function getProductReviews() {
    const reviews = [];
    
    // Try different common selectors for reviews
    const reviewSelectors = [
        '.review',
        '.customer-review',
        '[data-testid="review"]',
        '.review-text',
        '.review-content',
        '.review-body'
    ];

    // Get review elements
    for (const selector of reviewSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            elements.forEach(element => {
                const reviewText = element.textContent || element.innerText;
                if (reviewText && reviewText.trim().length > 0) {
                    reviews.push({
                        text: reviewText.trim(),
                        rating: getReviewRating(element),
                        date: getReviewDate(element)
                    });
                }
            });
            break; // Stop if we found reviews
        }
    }

    // Limit to 10 most recent reviews
    return reviews.slice(0, 10);
}

function getReviewRating(element) {
    // Try to find rating within the review element
    const ratingSelectors = [
        '.rating',
        '.star-rating',
        '[data-testid="rating"]',
        '.review-rating'
    ];

    for (const selector of ratingSelectors) {
        const ratingElement = element.querySelector(selector);
        if (ratingElement) {
            const ratingText = ratingElement.textContent || ratingElement.innerText;
            const rating = ratingText.match(/[\d.]+/);
            if (rating) {
                return parseFloat(rating[0]);
            }
        }
    }

    return null;
}

function getReviewDate(element) {
    // Try to find date within the review element
    const dateSelectors = [
        '.review-date',
        '.date',
        '[data-testid="review-date"]',
        '.review-timestamp'
    ];

    for (const selector of dateSelectors) {
        const dateElement = element.querySelector(selector);
        if (dateElement) {
            return dateElement.textContent || dateElement.innerText;
        }
    }

    return null;
}

function getProductSpecifications() {
    const specs = {};
    
    // Try different common selectors for specifications
    const specSelectors = [
        '.specifications',
        '.product-specs',
        '[data-testid="specifications"]',
        '.technical-details',
        '#productDetails'
    ];

    for (const selector of specSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            // Try to find specification rows
            const rows = element.querySelectorAll('tr, .spec-row, .spec-item');
            rows.forEach(row => {
                const label = row.querySelector('th, .spec-label, .spec-name');
                const value = row.querySelector('td, .spec-value, .spec-detail');
                if (label && value) {
                    const labelText = label.textContent.trim();
                    const valueText = value.textContent.trim();
                    if (labelText && valueText) {
                        specs[labelText] = valueText;
                    }
                }
            });
        }
    }

    return specs;
} 
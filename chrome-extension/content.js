// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProductInfo') {
    const productInfo = extractProductInfo();
    sendResponse(productInfo);
  }
});

function extractProductInfo() {
  // Common selectors for both Amazon and Flipkart
  const selectors = {
    amazon: {
      title: '#productTitle',
      description: '#productDescription',
      price: '.a-price-whole',
      brand: '#bylineInfo',
      images: '#landingImage'
    },
    flipkart: {
      title: 'h1._2iDkf8',
      description: 'div._1mXcCf',
      price: '._30jeq3._16Jk6d',
      brand: '._2W4v77',
      images: 'img._396cs4'
    }
  };

  // Determine which website we're on
  const isAmazon = window.location.hostname.includes('amazon.in');
  const isFlipkart = window.location.hostname.includes('flipkart.com');
  
  const currentSelectors = isAmazon ? selectors.amazon : selectors.flipkart;

  // Extract information using the appropriate selectors
  const productInfo = {
    title: document.querySelector(currentSelectors.title)?.textContent.trim(),
    description: document.querySelector(currentSelectors.description)?.textContent.trim(),
    price: document.querySelector(currentSelectors.price)?.textContent.trim(),
    brand: document.querySelector(currentSelectors.brand)?.textContent.trim(),
    url: window.location.href,
    images: Array.from(document.querySelectorAll(currentSelectors.images))
      .map(img => img.src)
      .filter(src => src)
  };

  return productInfo;
} 
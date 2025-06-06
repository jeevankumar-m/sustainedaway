// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'analyzeProduct') {
        console.log('Processing analyzeProduct request');
        
        // Store the product info
        chrome.storage.local.set({ 'currentProduct': request.productInfo }, () => {
            console.log('Product info stored:', request.productInfo);
            
            // Open the popup
            chrome.windows.create({
                url: 'popup.html',
                type: 'popup',
                width: 600,
                height: 800,
                left: Math.round((screen.width - 600) / 2),
                top: Math.round((screen.height - 800) / 2)
            }, (window) => {
                console.log('Popup window created:', window);
                sendResponse({ success: true, windowId: window.id });
            });
        });
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }
});

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Listen for errors
chrome.runtime.onError.addListener((error) => {
    console.error('Extension error:', error);
}); 
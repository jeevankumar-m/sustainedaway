document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsDiv = document.getElementById('results');

  // Show loading animation
  function showLoading() {
    resultsDiv.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-circle spinner-1"></div>
          <div class="spinner-circle spinner-2"></div>
          <div class="spinner-circle spinner-3"></div>
          <div class="spinner-circle spinner-4"></div>
        </div>
        <p class="loading-text">Analyzing product sustainability...</p>
      </div>
    `;
  }

  // Function to analyze product
  async function analyzeProduct() {
    try {
      showLoading();
      
      // Get product info from active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      // First, ensure content script is injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (error) {
        console.log('Content script already injected or injection failed:', error);
      }

      // Wait a bit for the content script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get product info from content script
      const productInfo = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: "getProductInfo" }, response => {
          if (chrome.runtime.lastError) {
            reject(new Error('Failed to get product info: ' + chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (!productInfo) {
        throw new Error('No product information found on the page');
      }

      console.log('Sending request with data:', productInfo);

      // Send to server
      const response = await fetch('http://localhost:5000/analyze-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(productInfo)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      displayResults(data);
    } catch (error) {
      console.error('Analysis error:', error);
      showError(error.message);
    }
  }

  function showError(message) {
    resultsDiv.innerHTML = `
      <div class="error-container">
        <h3>❌ Error</h3>
        <p>${message}</p>
        <button id="retryButton">🔄 Retry</button>
      </div>
    `;
    // Add event listener to retry button
    document.getElementById('retryButton').addEventListener('click', () => {
      window.location.reload();
    });
  }

  function displayResults(data) {
    if (!resultsDiv) return;

    // Ensure all data is properly structured
    const analysis = data.analysis || {
      environmental: 'No analysis available.',
      health: 'No analysis available.',
      social: 'No analysis available.'
    };

    // Default recommendations for each category
    const defaultRecommendations = {
      environmental: [
        'Consider products with eco-friendly packaging',
        'Look for products with recyclable materials',
        'Choose products with minimal carbon footprint',
        'Support brands with sustainable manufacturing practices'
      ],
      health: [
        'Check for harmful chemicals in ingredients',
        'Look for natural and organic alternatives',
        'Consider hypoallergenic options',
        'Research product safety certifications'
      ],
      social: [
        'Support brands with fair labor practices',
        'Look for companies with transparent supply chains',
        'Consider local and small business alternatives',
        'Check for ethical business certifications'
      ]
    };

    // Merge default recommendations with any provided recommendations
    const recommendations = {
      environmental: data.recommendations?.environmental || defaultRecommendations.environmental,
      health: data.recommendations?.health || defaultRecommendations.health,
      social: data.recommendations?.social || defaultRecommendations.social
    };

    const keyFeatures = data.key_features || {
      positive: [],
      negative: []
    };

    const certifications = Array.isArray(data.certifications) ? data.certifications : [];
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    const specifications = data.specifications || {};

    // Calculate score color
    const score = data.score || 0;
    const scoreColor = score >= 4 ? '#2ecc71' : score >= 3 ? '#f1c40f' : '#e74c3c';

    resultsDiv.innerHTML = `
      <div class="product-header">
        <h3>${data.title || 'Product Analysis'} ${getEmojiForScore(score)}</h3>
        <div class="score-container" style="border-color: ${scoreColor}">
          <div class="score" style="color: ${scoreColor}">${score}/5</div>
          <div class="score-label">Sustainability Score</div>
        </div>
      </div>

      <div class="analysis-tabs">
        <div class="tab active" data-tab="environmental">
          🌿 Environmental
        </div>
        <div class="tab" data-tab="health">
          ❤️ Health
        </div>
        <div class="tab" data-tab="social">
          👥 Social
        </div>
      </div>

      <div class="tab-content">
        <div class="tab-pane active" id="environmental">
          <div class="analysis-section">
            <h4>🌍 Environmental Impact</h4>
            <p>${analysis.environmental || data.analysis || 'No analysis available.'}</p>
          </div>
          <div class="recommendations-section">
            <h4>💡 Recommendations</h4>
            <ul>
              ${recommendations.environmental.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="tab-pane" id="health">
          <div class="analysis-section">
            <h4>🏥 Health Impact</h4>
            <p>${analysis.health || 'No analysis available.'}</p>
          </div>
          <div class="recommendations-section">
            <h4>💡 Recommendations</h4>
            <ul>
              ${recommendations.health.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="tab-pane" id="social">
          <div class="analysis-section">
            <h4>🤝 Social Impact</h4>
            <p>${analysis.social || 'No analysis available.'}</p>
          </div>
          <div class="recommendations-section">
            <h4>💡 Recommendations</h4>
            <ul>
              ${recommendations.social.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>

      ${Object.keys(specifications).length > 0 ? `
        <div class="specifications-section">
          <h4>📋 Product Specifications</h4>
          <div class="specs-grid">
            ${Object.entries(specifications).map(([key, value]) => `
              <div class="spec-item">
                <span class="spec-label">${key}</span>
                <span class="spec-value">${value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${certifications.length > 0 ? `
        <div class="certifications-section">
          <h4>🏆 Certifications</h4>
          <ul>
            ${certifications.map(cert => `<li>${cert}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="key-features">
        ${keyFeatures.positive.length > 0 ? `
          <div class="positive-features">
            <h4>✨ Positive Features</h4>
            <ul>
              ${keyFeatures.positive.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${keyFeatures.negative.length > 0 ? `
          <div class="negative-features">
            <h4>⚠️ Areas for Improvement</h4>
            <ul>
              ${keyFeatures.negative.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    // Add tab switching functionality
    const tabs = resultsDiv.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        resultsDiv.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        resultsDiv.querySelector(`#${tabId}`).classList.add('active');
      });
    });
  }

  // Helper function to get emoji based on score
  function getEmojiForScore(score) {
    if (score >= 4) return '🌱';
    if (score >= 3) return '🌿';
    if (score >= 2) return '🍃';
    return '🍂';
  }

  // Helper function to calculate average rating
  function calculateAverageRating(reviews) {
    const validRatings = reviews.filter(review => review.rating !== null).map(review => review.rating);
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((a, b) => a + b, 0);
    return (sum / validRatings.length).toFixed(1);
  }

  // Helper function to get star rating display
  function getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return '⭐'.repeat(fullStars) + (halfStar ? '⭐' : '') + '☆'.repeat(emptyStars);
  }

  // Add CSS
  const style = document.createElement('style');
  style.textContent = `
    body {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      color: #333;
    }

    #results {
      position: relative;
      z-index: 1;
    }

    /* Loading animation styles */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      min-height: 300px;
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
      border-radius: 25px;
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(46, 204, 113, 0.2);
      position: relative;
      z-index: 2;
    }

    .loading-spinner {
      position: relative;
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
    }

    .spinner-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 4px solid transparent;
      border-radius: 50%;
      animation: spin 2s linear infinite;
    }

    .spinner-1 {
      border-top-color: #2ecc71;
      animation-delay: 0s;
    }

    .spinner-2 {
      border-right-color: #27ae60;
      animation-delay: 0.5s;
    }

    .spinner-3 {
      border-bottom-color: #2ecc71;
      animation-delay: 1s;
    }

    .spinner-4 {
      border-left-color: #27ae60;
      animation-delay: 1.5s;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg) scale(1);
      }
      50% {
        transform: rotate(180deg) scale(1.1);
      }
      100% {
        transform: rotate(360deg) scale(1);
      }
    }

    .loading-text {
      font-size: 16px;
      color: #2ecc71;
      font-weight: 600;
      text-align: center;
      margin-top: 20px;
      animation: pulse 1.5s ease-in-out infinite;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    @keyframes pulse {
      0% {
        opacity: 0.6;
        transform: scale(0.98);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
      100% {
        opacity: 0.6;
        transform: scale(0.98);
      }
    }

    /* Enhanced UI styles */
    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 20px;
      border-radius: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      border: 1px solid rgba(46, 204, 113, 0.2);
      animation: slideDown 0.5s ease-out;
      position: relative;
      z-index: 1;
    }

    .product-header h3 {
      color: #2ecc71;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .score-container {
      text-align: center;
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
      padding: 15px 25px;
      border-radius: 25px;
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      transition: all 0.3s ease;
      border: 2px solid;
    }

    .score-container:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .score {
      font-size: 28px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }

    .score-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
    }

    .analysis-tabs {
      display: flex;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      border: 1px solid rgba(46, 204, 113, 0.2);
      position: relative;
      z-index: 1;
    }

    .tab {
      padding: 15px 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      flex: 1;
      text-align: center;
      font-weight: 500;
      color: #333;
    }

    .tab:hover {
      background: rgba(46, 204, 113, 0.1);
    }

    .tab.active {
      color: #2ecc71;
      font-weight: 600;
      background: rgba(46, 204, 113, 0.1);
    }

    .tab-pane {
      display: none;
      padding: 25px;
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      border: 1px solid rgba(46, 204, 113, 0.2);
      margin-top: 20px;
      position: relative;
      z-index: 1;
    }

    .tab-pane.active {
      display: block;
    }

    .analysis-section, .recommendations-section {
      margin-bottom: 25px;
      padding: 25px;
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      border: 1px solid rgba(46, 204, 113, 0.2);
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
    }

    .analysis-section p, .recommendations-section p {
      color: #333;
      line-height: 1.6;
      margin: 0;
    }

    .analysis-section ul, .recommendations-section ul {
      list-style-type: none;
      padding-left: 0;
      margin: 0;
    }

    .analysis-section li, .recommendations-section li {
      margin-bottom: 10px;
      padding-left: 25px;
      position: relative;
      color: #333;
    }

    .analysis-section li:before, .recommendations-section li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #2ecc71;
      font-size: 20px;
    }

    .positive-features {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-radius: 20px;
      padding: 25px;
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      border: 1px solid rgba(46, 204, 113, 0.2);
      position: relative;
      z-index: 1;
    }

    .negative-features {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      border-radius: 20px;
      padding: 25px;
      box-shadow: 0 8px 32px rgba(244, 67, 54, 0.15);
      border: 1px solid rgba(244, 67, 54, 0.2);
      position: relative;
      z-index: 1;
    }

    .specifications-section, .certifications-section {
      border-radius: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      border: 1px solid rgba(46, 204, 113, 0.2);
      padding: 25px;
      margin-top: 20px;
      position: relative;
      z-index: 1;
    }

    .spec-item {
      background: linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%);
      border-radius: 15px;
      padding: 15px;
      box-shadow: 0 4px 16px rgba(46, 204, 113, 0.1);
      border: 1px solid rgba(46, 204, 113, 0.1);
      margin-bottom: 10px;
    }

    .spec-label {
      color: #2ecc71;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .spec-value {
      color: #333;
    }

    .error-container {
      text-align: center;
      padding: 30px;
      color: #e74c3c;
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(244, 67, 54, 0.15);
      border: 1px solid rgba(244, 67, 54, 0.2);
      animation: shake 0.5s ease-in-out;
      position: relative;
      z-index: 2;
    }

    .error-container h3 {
      color: #e74c3c;
      margin: 0 0 15px 0;
      font-size: 1.5rem;
    }

    .error-container p {
      color: #e74c3c;
      margin: 0 0 20px 0;
    }

    .error-container button {
      margin-top: 15px;
      padding: 12px 25px;
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 32px rgba(46, 204, 113, 0.15);
      font-weight: 600;
    }

    .error-container button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(46, 204, 113, 0.25);
    }
  `;
  document.head.appendChild(style);

  // Start analysis when popup opens
  analyzeProduct();
}); 
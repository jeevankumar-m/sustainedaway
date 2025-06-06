document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsDiv = document.getElementById('results');

  // Show loading animation
  function showLoading() {
    resultsDiv.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
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
    /* Loading animation styles */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      min-height: 300px;
      background: #ffffff;
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
      animation: spin 1.5s linear infinite;
    }

    .spinner-circle:nth-child(1) {
      border-top-color: #2ecc71;
      animation-delay: 0s;
    }

    .spinner-circle:nth-child(2) {
      border-right-color: #27ae60;
      animation-delay: 0.5s;
    }

    .spinner-circle:nth-child(3) {
      border-bottom-color: #2ecc71;
      animation-delay: 1s;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      font-size: 16px;
      color: #2ecc71;
      font-weight: 500;
      text-align: center;
      margin-top: 20px;
      animation: pulse 1.5s ease-in-out infinite;
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
      padding-bottom: 15px;
      border-bottom: 2px solid #e8f5e9;
      animation: slideDown 0.5s ease-out;
      background: linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%);
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    @keyframes slideDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .score-container {
      text-align: center;
      background: #ffffff;
      padding: 10px 20px;
      border-radius: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
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
      border-bottom: 2px solid #e8f5e9;
      animation: fadeIn 0.5s ease-out;
      background: #ffffff;
      border-radius: 10px 10px 0 0;
      overflow: hidden;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .tab {
      padding: 12px 24px;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      flex: 1;
      text-align: center;
    }

    .tab:hover {
      background: #f1f8e9;
    }

    .tab.active {
      border-bottom-color: #2ecc71;
      color: #2ecc71;
      font-weight: bold;
    }

    .tab.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: #2ecc71;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    .tab-pane {
      display: none;
      padding: 20px;
      animation: fadeIn 0.5s ease-out;
      background: #ffffff;
      border-radius: 0 0 10px 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    .tab-pane.active {
      display: block;
    }

    .analysis-section, .recommendations-section {
      margin-bottom: 25px;
      padding: 20px;
      background: #f9fbe7;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
    }

    .analysis-section:hover, .recommendations-section:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .certifications-section, .key-features {
      margin-top: 25px;
      padding: 20px;
      border-top: 2px solid #e8f5e9;
      animation: fadeIn 0.5s ease-out;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    .positive-features, .negative-features {
      margin-top: 20px;
      padding: 20px;
      border-radius: 10px;
      transition: all 0.3s ease;
    }

    .positive-features {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
    }

    .negative-features {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
    }

    .positive-features:hover, .negative-features:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    ul {
      list-style-type: none;
      padding-left: 0;
    }

    li {
      margin-bottom: 10px;
      padding-left: 25px;
      position: relative;
      transition: all 0.3s ease;
    }

    li:hover {
      transform: translateX(5px);
    }

    li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #2ecc71;
      font-size: 20px;
    }

    .error-container {
      text-align: center;
      padding: 30px;
      color: #e74c3c;
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      border-radius: 10px;
      animation: shake 0.5s ease-in-out;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .error-container button {
      margin-top: 15px;
      padding: 10px 20px;
      background-color: #2ecc71;
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .error-container button:hover {
      background-color: #27ae60;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    h4 {
      color: #2ecc71;
      margin-bottom: 15px;
      font-size: 18px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    p {
      line-height: 1.6;
      color: #333;
    }

    /* New styles for reviews and specifications */
    .reviews-section {
      margin-bottom: 25px;
    }

    .reviews-summary {
      text-align: center;
      margin-bottom: 20px;
      padding: 15px;
      background: #f9fbe7;
      border-radius: 10px;
    }

    .average-rating {
      font-size: 24px;
      margin-bottom: 10px;
    }

    .rating-number {
      font-weight: bold;
      color: #2ecc71;
      margin-right: 10px;
    }

    .rating-stars {
      color: #f1c40f;
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .review-card {
      background: #ffffff;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      transition: transform 0.3s ease;
    }

    .review-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .review-rating {
      color: #f1c40f;
    }

    .review-date {
      color: #666;
      font-size: 12px;
    }

    .review-text {
      color: #333;
      line-height: 1.5;
    }

    .specifications-section {
      margin-top: 25px;
      padding: 20px;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    .specs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .spec-item {
      background: #f9fbe7;
      padding: 10px;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
    }

    .spec-label {
      font-weight: bold;
      color: #2ecc71;
      margin-bottom: 5px;
    }

    .spec-value {
      color: #333;
    }
  `;
  document.head.appendChild(style);

  // Start analysis when popup opens
  analyzeProduct();
}); 
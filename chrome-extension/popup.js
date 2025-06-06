document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsDiv = document.getElementById('results');

  // Show loading animation
  function showLoading() {
    resultsDiv.innerHTML = `
      <div class="loading-container">
        <div class="nature-loader">
          <div class="leaf leaf-1"></div>
          <div class="leaf leaf-2"></div>
          <div class="leaf leaf-3"></div>
          <div class="leaf leaf-4"></div>
          <div class="leaf leaf-5"></div>
        </div>
        <p class="loading-text">🌱 Analyzing product sustainability...</p>
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

    const recommendations = data.recommendations || {
      environmental: ['No recommendations available.'],
      health: ['No recommendations available.'],
      social: ['No recommendations available.']
    };

    const keyFeatures = data.key_features || {
      positive: [],
      negative: []
    };

    const certifications = Array.isArray(data.certifications) ? data.certifications : [];

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
              ${(recommendations.environmental || data.recommendations || ['No recommendations available.']).map(rec => `<li>${rec}</li>`).join('')}
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
              ${(recommendations.health || ['No recommendations available.']).map(rec => `<li>${rec}</li>`).join('')}
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
              ${(recommendations.social || ['No recommendations available.']).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>

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

  // Add CSS
  const style = document.createElement('style');
  style.textContent = `
    /* Nature-themed loading animation */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      min-height: 300px;
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
    }

    .nature-loader {
      position: relative;
      width: 100px;
      height: 100px;
      margin-bottom: 20px;
    }

    .leaf {
      position: absolute;
      width: 20px;
      height: 20px;
      background: #2ecc71;
      border-radius: 50% 0 50% 50%;
      transform-origin: 100% 0;
      animation: leaf-fall 2s infinite;
    }

    .leaf-1 { animation-delay: 0s; }
    .leaf-2 { animation-delay: 0.4s; }
    .leaf-3 { animation-delay: 0.8s; }
    .leaf-4 { animation-delay: 1.2s; }
    .leaf-5 { animation-delay: 1.6s; }

    @keyframes leaf-fall {
      0% {
        transform: rotate(0deg) translate(0, 0);
        opacity: 1;
      }
      100% {
        transform: rotate(360deg) translate(50px, 50px);
        opacity: 0;
      }
    }

    .loading-text {
      font-size: 16px;
      color: #2ecc71;
      animation: pulse 1.5s infinite;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
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
  `;
  document.head.appendChild(style);

  // Start analysis when popup opens
  analyzeProduct();
}); 
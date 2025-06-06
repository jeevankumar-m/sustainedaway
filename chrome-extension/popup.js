document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsDiv = document.getElementById('results');

  // Show loading animation
  function showLoading() {
    resultsDiv.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Analyzing product sustainability...</p>
      </div>
    `;
  }

  // Function to analyze product
  async function analyzeProduct() {
    try {
      showLoading();
      
      // Sample product data for testing - matching server's expected format
      const productInfo = {
        title: "Sample Product",
        description: "This is a sample product description for testing the UI. This product is made with sustainable materials and follows eco-friendly manufacturing processes.",
        brand: "Sample Brand",
        price: "99.99",
        category: "Electronics",
        url: "https://example.com/product"
      };

      console.log('Sending request with data:', productInfo);

      const response = await fetch('http://localhost:5000/analyze-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(productInfo)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      displayResults(data);
    } catch (error) {
      console.error('Analysis error:', error);
      resultsDiv.innerHTML = `
        <div class="error-container">
          <h3>Error</h3>
          <p>${error.message}</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
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

    resultsDiv.innerHTML = `
      <div class="product-header">
        <h3>${data.title || 'Product Analysis'}</h3>
        <div class="score-container">
          <div class="score">${data.score || 0}/5</div>
          <div class="score-label">Sustainability Score</div>
        </div>
      </div>

      <div class="analysis-tabs">
        <div class="tab active" data-tab="environmental">
          <i class="fas fa-leaf"></i> Environmental
        </div>
        <div class="tab" data-tab="health">
          <i class="fas fa-heartbeat"></i> Health
        </div>
        <div class="tab" data-tab="social">
          <i class="fas fa-users"></i> Social
        </div>
      </div>

      <div class="tab-content">
        <div class="tab-pane active" id="environmental">
          <div class="analysis-section">
            <h4>Environmental Impact</h4>
            <p>${analysis.environmental || data.analysis || 'No analysis available.'}</p>
          </div>
          <div class="recommendations-section">
            <h4>Recommendations</h4>
            <ul>
              ${(recommendations.environmental || data.recommendations || ['No recommendations available.']).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="tab-pane" id="health">
          <div class="analysis-section">
            <h4>Health Impact</h4>
            <p>${analysis.health || 'No analysis available.'}</p>
          </div>
          <div class="recommendations-section">
            <h4>Recommendations</h4>
            <ul>
              ${(recommendations.health || ['No recommendations available.']).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="tab-pane" id="social">
          <div class="analysis-section">
            <h4>Social Impact</h4>
            <p>${analysis.social || 'No analysis available.'}</p>
          </div>
          <div class="recommendations-section">
            <h4>Recommendations</h4>
            <ul>
              ${(recommendations.social || ['No recommendations available.']).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>

      ${certifications.length > 0 ? `
        <div class="certifications-section">
          <h4>Certifications</h4>
          <ul>
            ${certifications.map(cert => `<li>${cert}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="key-features">
        ${keyFeatures.positive.length > 0 ? `
          <div class="positive-features">
            <h4>Positive Features</h4>
            <ul>
              ${keyFeatures.positive.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${keyFeatures.negative.length > 0 ? `
          <div class="negative-features">
            <h4>Areas for Improvement</h4>
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
        // Remove active class from all tabs and panes
        tabs.forEach(t => t.classList.remove('active'));
        resultsDiv.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding pane
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        resultsDiv.querySelector(`#${tabId}`).classList.add('active');
      });
    });
  }

  // Add CSS
  const style = document.createElement('style');
  style.textContent = `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      text-align: center;
      padding: 20px;
      color: #e74c3c;
    }

    .error-container button {
      margin-top: 10px;
      padding: 8px 16px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .error-container button:hover {
      background-color: #2980b9;
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }

    .score-container {
      text-align: center;
    }

    .score {
      font-size: 24px;
      font-weight: bold;
      color: #2ecc71;
    }

    .score-label {
      font-size: 12px;
      color: #666;
    }

    .analysis-tabs {
      display: flex;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .tab {
      padding: 10px 20px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }

    .tab.active {
      border-bottom-color: #3498db;
      color: #3498db;
    }

    .tab-pane {
      display: none;
      padding: 20px 0;
    }

    .tab-pane.active {
      display: block;
    }

    .analysis-section, .recommendations-section {
      margin-bottom: 20px;
    }

    .certifications-section, .key-features {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .positive-features, .negative-features {
      margin-top: 15px;
    }

    ul {
      list-style-type: none;
      padding-left: 0;
    }

    li {
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }

    li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #3498db;
    }
  `;
  document.head.appendChild(style);

  // Start analysis when popup opens
  analyzeProduct();
}); 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Verify credentials are loaded
console.log('Twitter Consumer Key:', process.env.TWITTER_CONSUMER_KEY ? 'Loaded' : 'Missing');
console.log('Twitter Access Token:', process.env.TWITTER_ACCESS_TOKEN ? 'Loaded' : 'Missing');

const oauth = OAuth({
  consumer: {
    key: process.env.TWITTER_CONSUMER_KEY,
    secret: process.env.TWITTER_CONSUMER_SECRET
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => {
    console.log('Generating signature...');
    return crypto.createHmac('sha1', key).update(baseString).digest('base64');
  }
});

app.post('/api/tweet', async (req, res) => {
  try {
    const { text } = req.body;
    console.log('Received tweet request:', text);
    
    const token = {
      key: process.env.TWITTER_ACCESS_TOKEN,
      secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    };

    const url = 'https://api.twitter.com/2/tweets';
    const authData = oauth.authorize({ url, method: 'POST' }, token);
    console.log('Auth data:', authData);
    
    const authHeader = oauth.toHeader(authData);
    console.log('Auth header:', authHeader);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeader,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    console.log('Twitter response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error details:', errorText);
      throw new Error(`Twitter API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to post tweet',
      details: error.response ? await error.response.text() : null
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
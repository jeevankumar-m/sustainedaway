require('dotenv').config();
const FormData = require('form-data');
const express = require('express');
const cors = require('cors');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased from default 100kb
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Verify credentials
console.log('Twitter Consumer Key:', process.env.TWITTER_CONSUMER_KEY ? 'Loaded' : 'Missing');
console.log('Twitter Access Token:', process.env.TWITTER_ACCESS_TOKEN ? 'Loaded' : 'Missing');

// Initialize OAuth with proper credentials
const oauth = OAuth({
  consumer: {
    key: process.env.TWITTER_CONSUMER_KEY,
    secret: process.env.TWITTER_CONSUMER_SECRET
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

// Helper function to safely parse JSON responses
async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('Failed to parse response:', text);
    throw new Error('Invalid API response format');
  }
}

// Enhanced media upload function with better error handling
async function uploadMedia(buffer, token) {
  const mediaUrl = 'https://upload.twitter.com/1.1/media/upload.json';
  const authHeader = oauth.toHeader(oauth.authorize({
    url: mediaUrl,
    method: 'POST'
  }, token));

  const formData = new FormData();
  formData.append('media', buffer, {
    filename: 'feedback.jpg',
    contentType: 'image/jpeg'
  });

  const response = await fetch(mediaUrl, {
    method: 'POST',
    headers: {
      ...authHeader,
      ...formData.getHeaders(),
      'Accept': 'application/json'
    },
    body: formData
  });

  const data = await parseResponse(response);
  
  if (!response.ok) {
    console.error('Media upload error:', data);
    throw new Error(data.errors?.[0]?.message || 'Media upload failed');
  }

  return data;
}

app.post('/api/tweet', async (req, res) => {
  try {
    const { text, imageData } = req.body;
    
    if (!text || typeof text !== 'string') {
      throw new Error('Valid text content is required');
    }

    const token = {
      key: process.env.TWITTER_ACCESS_TOKEN,
      secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    };

    // Handle media upload if provided
    let mediaId = null;
    if (imageData) {
      try {
        const buffer = Buffer.from(imageData.split(',')[1], 'base64');
        const mediaData = await uploadMedia(buffer, token);
        mediaId = mediaData.media_id_string;
      } catch (error) {
        console.error('Media upload failed:', error);
        throw new Error(`Image upload failed: ${error.message}`);
      }
    }

    // Post the tweet
    const url = 'https://api.twitter.com/2/tweets';
    const authHeader = oauth.toHeader(oauth.authorize({
      url,
      method: 'POST'
    }, token));

    const tweetData = {
      text: text,
      ...(mediaId && { media: { media_ids: [mediaId] } })
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeader,
        'content-type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(tweetData)
    });

    const data = await parseResponse(response);
    
    if (!response.ok) {
      throw new Error(data.detail || `Twitter API error: ${response.statusText}`);
    }

    if (!data?.data?.id) {
      throw new Error('Invalid response from Twitter API');
    }

    res.json({
      success: true,
      tweetUrl: `https://twitter.com/${process.env.TWITTER_USERNAME}/status/${data.data.id}`,
      tweetId: data.data.id
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to post tweet'
    });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
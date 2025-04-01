require('dotenv').config();
const FormData = require('form-data');
const fs = require('fs');
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
      const { text, imageData } = req.body;
      
      const token = {
        key: process.env.TWITTER_ACCESS_TOKEN,
        secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
      };
  
      // 1. Upload media if image exists
      let mediaId = null;
      if (imageData) {
        const buffer = Buffer.from(imageData.split(',')[1], 'base64');
        const mediaUrl = 'https://upload.twitter.com/1.1/media/upload.json';
        const mediaAuthHeader = oauth.toHeader(oauth.authorize({
          url: mediaUrl,
          method: 'POST'
        }, token));
  
        const formData = new FormData();
        formData.append('media', buffer, { 
          filename: 'feedback.jpg',
          contentType: 'image/jpeg'
        });
  
        const mediaResponse = await fetch(mediaUrl, {
          method: 'POST',
          headers: {
            ...mediaAuthHeader,
            ...formData.getHeaders()
          },
          body: formData
        });
  
        const mediaData = await mediaResponse.json();
        mediaId = mediaData.media_id_string;
      }
  
      // 2. Post tweet
      const url = 'https://api.twitter.com/2/tweets';
      const authHeader = oauth.toHeader(oauth.authorize({
        url,
        method: 'POST'
      }, token));
  
      const tweetData = {
        text: text,
        ...(mediaId && { media: { media_ids: [mediaId] } }) // Conditionally add media
      };
  
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...authHeader,
          'content-type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });
  
      const data = await response.json();
      
      // 3. Return tweet URL (single response)
      const tweetUrl = `https://twitter.com/${process.env.TWITTER_USERNAME}/status/${data.data.id}`;
      res.json({ 
        success: true,
        tweetUrl,
        tweetId: data.data.id,
        data // Optional: include full response if needed
      });
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to post tweet'
      });
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
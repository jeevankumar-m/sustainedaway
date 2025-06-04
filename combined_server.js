import 'dotenv/config';
import admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Initialize Express
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize OAuth
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

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Combined Server is running!");
});

// Image processing endpoint
app.post("/api/process-image", async (req, res) => {
  console.log("🔍 Received Image for Processing...");

  const { base64Image, userId, imageUrl } = req.body;
  if (!base64Image) {
    return res.status(400).json({ error: "No image provided." });
  }

  const imagePath = path.join(__dirname, "temp_image.jpg");
  try {
    fs.writeFileSync(imagePath, Buffer.from(base64Image, "base64"));

    const python = spawn("python", [path.join(__dirname, "process_image.py"), imagePath]);

    let result = "";
    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("❌ Error from Python:", data.toString());
    });

    python.on("close", async (code) => {
      console.log("✅ Processed Image Result:", result);

      try {
        const jsonResponse = JSON.parse(result.trim());

        if (!jsonResponse || typeof jsonResponse !== "object") {
          throw new Error("Invalid response format.");
        }

        // Structure the data for Firestore
        const historyData = {
          productName: jsonResponse["Product Name"] || "Unknown Product",
          brand: jsonResponse["Brand"] || "Unknown Brand",
          sustainabilityScore: parseFloat(jsonResponse["Sustainability Rating"]) || 0,
          packagingMaterial: jsonResponse["Packaging Material"] || "Not available",
          ingredientsImpact: jsonResponse["Ingredients Impact"] || "Not available",
          recyclingFeasibility: jsonResponse["Recycling Feasibility"] || "Not available",
          healthimpact: jsonResponse["Health Impact"] || null,
          recyclingtips: jsonResponse["Recycling Tips"] || null,
          imageUrl: imageUrl,
          dateScanned: admin.firestore.FieldValue.serverTimestamp(),
          userId: userId
        };
        
        // Save to Firestore
        const docRef = await db.collection("history").add(historyData);
        console.log(`📌 History saved to Firestore with ID: ${docRef.id}`);

        // Clean up
        fs.unlinkSync(imagePath);

        // Send response
        res.json({ id: docRef.id, ...jsonResponse });

      } catch (error) {
        console.error("⚠️ JSON Parsing Error:", error.message);
        res.status(500).json({ error: "Invalid JSON response from AI." });
      }
    });

  } catch (error) {
    console.error("⚠️ File Write Error:", error.message);
    res.status(500).json({ error: "Failed to save the image." });
  }
});

// Bill processing endpoint
app.post("/api/process-bill", async (req, res) => {
  console.log("🧾 Received Bill Image for Processing...");

  const { base64Image } = req.body;
  if (!base64Image) {
    return res.status(400).json({ error: "No image provided." });
  }

  const imagePath = path.join(__dirname, "temp_bill.jpg");
  try {
    fs.writeFileSync(imagePath, Buffer.from(base64Image, "base64"));

    const python = spawn("python", [path.join(__dirname, "process_bill.py"), imagePath]);

    let result = "";
    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("❌ Error from Python:", data.toString());
    });

    python.on("close", (code) => {
      console.log("✅ Processed Bill Result:", result);

      try {
        const jsonResponse = JSON.parse(result.trim());
        fs.unlinkSync(imagePath);
        res.json(jsonResponse);
      } catch (error) {
        console.error("⚠️ JSON Parsing Error:", error.message);
        res.status(500).json({ error: "Invalid JSON response from AI." });
      }
    });

  } catch (error) {
    console.error("⚠️ File Write Error:", error.message);
    res.status(500).json({ error: "Failed to save the image." });
  }
});

// Twitter integration endpoint
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Combined Server running on port ${PORT}`)); 
const admin = require("firebase-admin");
//this comment is to commit it to git lol
// Create a File named serviceAccountKey.json.json in the root directory and paste your firebase serviceaccounts credentials
const serviceAccount = require("./serviceAccountKey.json"); 
const express = require("express");
const cors = require("cors");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Virtual environment setup
const venvPath = path.join(__dirname, "venv");
const pythonExec = path.join(venvPath, "bin", "python");

// ✅ Set up virtual environment & install dependencies in render
try {
  console.log("📦 Setting up virtual environment...");
  if (!fs.existsSync(venvPath)) {
    execSync(`python3 -m venv ${venvPath}`, { stdio: "inherit" });
    console.log("✅ Virtual environment created!");
  }

  console.log("📦 Installing Python dependencies...");
  execSync(`${pythonExec} -m pip install -r ${path.join(__dirname, "requirements.txt")}`, { 
    stdio: "inherit" 
  });
  console.log("✅ Dependencies installed in virtual environment!");
} catch (error) {
  console.error("❌ Error installing Python dependencies:", error.message);
}

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Image Processing Server is running!");
});

// Image processing endpoint
app.post("/api/process-image", async (req, res) => {
  console.log("🔍 Received Image for Processing...");

  const { base64Image } = req.body;
  if (!base64Image) {
    return res.status(400).json({ error: "No image provided." });
  }

  const imagePath = path.join(__dirname, "temp_image.jpg"); // Use absolute path
  try {
    fs.writeFileSync(imagePath, Buffer.from(base64Image, "base64"));

    // Use virtual environment's Python and absolute path to script
    const python = spawn(
      pythonExec,
      [path.join(__dirname, "process_image.py"), imagePath]
    );

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

        // Store in Firestore
        const docRef = await db.collection("history").add(jsonResponse);
        console.log(`📌 Data saved to Firestore with ID: ${docRef.id}`);

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
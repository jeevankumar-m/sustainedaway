const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/api/process-bill", async (req, res) => {
  console.log("🧾 Received Bill Image for Processing...");

  const { base64Image } = req.body;
  if (!base64Image) {
    return res.status(400).json({ error: "No image provided." });
  }

  const imagePath = "temp_bill.jpg"; // Temporary file path
  try {
    fs.writeFileSync(imagePath, Buffer.from(base64Image, "base64")); // Save the image

    // Spawn Python process
    const python = spawn("python", ["process_bill.py", imagePath]);

    let result = "";
    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("❌ Error from Python:", data.toString());
    });

    python.on("close", async (code) => {
      console.log("✅ Processed Bill Result:", result);

      try {
        const jsonResponse = JSON.parse(result.trim());

        if (!jsonResponse || typeof jsonResponse !== "object") {
          throw new Error("Invalid response format.");
        }

        // 🔥 Store processed data in Firestore (bills collection)
        const docRef = await db.collection("bills").add(jsonResponse);
        console.log(`📌 Data saved to Firestore with ID: ${docRef.id}`);

        fs.unlinkSync(imagePath); // Clean up the temporary image file

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

app.listen(5001, () => console.log("🚀 Bill Scanning Server running on port 5001"));

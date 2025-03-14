const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Ensure JSON support

app.post("/api/process-image", (req, res) => {
  console.log("🔍 Received Image for Processing...");
  
  const { base64Image } = req.body;
  if (!base64Image) {
    return res.json({ error: "No image provided." });
  }

  const imagePath = "temp_image.jpg"; // Save base64 image temporarily
  require("fs").writeFileSync(imagePath, Buffer.from(base64Image, "base64"));

  // Spawn Python process
  const python = spawn("python", ["process_image.py", imagePath]);

  let result = "";
  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  python.stderr.on("data", (data) => {
    console.error("❌ Error from Python:", data.toString());
  });

  python.on("close", (code) => {
    console.log("✅ Processed Image Result:", result);
    
    try {
      const jsonResponse = JSON.parse(result.trim()); // Ensure valid JSON
      res.json(jsonResponse); // ✅ Send it correctly
    } catch (error) {
      res.json({ error: "Invalid JSON response from AI." });
    }
  });
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));

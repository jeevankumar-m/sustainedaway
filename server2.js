const { execSync } = require("child_process");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

const venvPath = path.join(__dirname, "venv");
const pythonExec = path.join(venvPath, "bin", "python");

// ✅ Set up virtual environment & install dependencies
try {
  console.log("📦 Setting up virtual environment...");
  if (!fs.existsSync(venvPath)) {
    execSync(`python3 -m venv ${venvPath}`, { stdio: "inherit" });
    console.log("✅ Virtual environment created!");
  }

  console.log("📦 Installing Python dependencies...");
  execSync(`${pythonExec} -m pip install -r ${path.join(__dirname, "requirements.txt")}`, { stdio: "inherit" });
  console.log("✅ Dependencies installed in virtual environment!");
} catch (error) {
  console.error("❌ Error installing Python dependencies:", error.message);
}

// ✅ Root Route - Check if server is running
app.get("/", (req, res) => {
  res.send("✅ Bill Scanning Server is running!");
});

// ✅ Bill Processing API Route
app.post("/api/process-bill", async (req, res) => {
  console.log("🧾 Received Bill Image for Processing...");

  const { base64Image } = req.body;
  if (!base64Image) {
    return res.status(400).json({ error: "No image provided." });
  }

  const imagePath = path.join(__dirname, "temp_bill.jpg"); // Temporary file path
  try {
    fs.writeFileSync(imagePath, Buffer.from(base64Image, "base64")); // Save the image

    // ✅ Run Python script inside virtual environment
    const python = spawn(pythonExec, [path.join(__dirname, "process_bill.py"), imagePath]);

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
        fs.unlinkSync(imagePath); // Cleanup temp file
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

// ✅ Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Bill Scanning Server running on port ${PORT}`));
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { spawn } = require("child_process"); // Import spawn for subprocesses
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.post("/api/process-image", async (req, res) => {
    try {
        const { base64Image } = req.body;
        if (!base64Image) {
            return res.status(400).json({ error: "No image provided" });
        }

        console.log("🔍 Received Image for Processing...");

        // Convert Base64 to an Image File
        const imagePath = "image.jpg";
        const imageBuffer = Buffer.from(base64Image, "base64");
        fs.writeFileSync(imagePath, imageBuffer);

        // Run Python script
        const pythonProcess = spawn("python", ["process_image.py", imagePath]);

        let result = "";

        pythonProcess.stdout.on("data", (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            console.error(`🔥 Python Error: ${data}`);
        });

        pythonProcess.on("close", (code) => {
            if (code === 0) {
                console.log("✅ Processed Image Result:", result);
                res.json({ extractedText: result.trim() });
            } else {
                res.status(500).json({ error: "Failed to process the image" });
            }

            // Delete the image after processing
            fs.unlinkSync(imagePath);
        });

    } catch (error) {
        console.error("🔥 Error processing image:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

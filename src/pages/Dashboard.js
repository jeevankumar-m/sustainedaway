import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, Button, CircularProgress } from "@mui/material";

const Dashboard = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [responseText, setResponseText] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setResponseText("Camera access denied.");
      }
    };

    startCamera();
  }, []);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);

    processImage(dataUrl.split(",")[1]);
  };

  const processImage = async (base64Image) => {
    setProcessing(true);
    setResponseText("");

    try {
      const response = await fetch("http://localhost:5000/api/process-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });

      const data = await response.json();
      setResponseText(data.extractedText || "No response from AI.");
    } catch (error) {
      console.error("Error processing image:", error);
      setResponseText("Failed to process the image.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h3" color="green">Sustainaway Scanner 🌱</Typography>

      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", marginTop: "10px" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <Button variant="contained" color="primary" onClick={captureImage} style={{ margin: "20px" }}>
        Capture Image
      </Button>

      {capturedImage && <img src={capturedImage} alt="Captured" style={{ maxWidth: "100%", marginTop: "10px" }} />}

      {processing && <CircularProgress style={{ marginTop: "20px" }} />}

      {responseText && (
        <Typography variant="h6" style={{ marginTop: "10px" }}>
          Extracted Data: {responseText}
        </Typography>
      )}
    </Container>
  );
};

export default Dashboard;
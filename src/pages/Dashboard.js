import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, IconButton, CircularProgress } from "@mui/material";
import { FaCamera, FaBars, FaHome, FaHistory, FaRecycle, FaSignOutAlt } from "react-icons/fa";
import "./Dashboard.css"; // External CSS for styling

const Dashboard = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
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
    <Container className="dashboard">
      {/* Top Bar with Menu and Sign Out */}
      <div className="top-bar">
        <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          <FaBars />
        </IconButton>
        <Typography variant="h5" className="title">Sustainaway 🌱</Typography>
        <IconButton className="sign-out-button">
          <FaSignOutAlt />
        </IconButton>
      </div>

      {/* Camera View */}
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline className="camera-view" />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* Capture Button */}
      <div className="capture-container">
        <IconButton className="capture-button" onClick={captureImage}>
          <FaCamera />
        </IconButton>
      </div>

      {/* AI Response Box */}
      {responseText && (
        <div className="response-box">
          <Typography variant="h6">🧠 AI Response:</Typography>
          <p>{responseText}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {processing && <CircularProgress className="loading-spinner" />}

      {/* Background Overlay when Menu is Open */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

      {/* Floating Menu - Sliding in from the Left */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => setMenuOpen(false)}><FaHome /> Home</li>
          <li onClick={() => setMenuOpen(false)}><FaHistory /> History</li>
          <li onClick={() => setMenuOpen(false)}><FaRecycle /> Recycle Guide</li>
          <li onClick={() => setMenuOpen(false)}><FaSignOutAlt /> Sign Out</li>
        </ul>
      </div>
    </Container>
  );
};

export default Dashboard;

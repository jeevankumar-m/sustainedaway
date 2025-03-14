import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, IconButton, CircularProgress } from "@mui/material";
import { FaCamera, FaBars, FaHome, FaHistory, FaRecycle, FaSignOutAlt } from "react-icons/fa";
import "./Dashboard.css"; // External CSS for styling

const Dashboard = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setResponseText("Camera access denied.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Stop camera on unmount
      }
    };
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

    // Stop the camera after capturing
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
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
      console.log("📝 AI Response Received:", data); // 🔍 Debug Log
  
      if (data.error) {
        setResponseText(`⚠️ Error: ${data.error}`); // Show error
      } else {
        // ✅ Debugging Keys from Response
        console.log("Keys in Response:", Object.keys(data)); 
  
        setResponseText(
          `📦 Product: ${data["Product Name"]}<br />` +
          `🏭 Brand: ${data.Brand}<br />` +
          `⚠️ Ingredients Impact: ${data["Ingredients Impact"]}<br />` +
          `♻️ Packaging Material: ${data["Packaging Material"]}<br />` +
          `🌍 Carbon Footprint: ${data["Carbon Footprint"]}<br />` +
          `🔄 Recycling Feasibility: ${data["Recycling Feasibility"]}<br />` +
          `🌱 Alternative Options: ${data["Alternative Options"]}<br />` +
          `⭐ Sustainability Rating: ${data["Sustainability Rating"]}/5`
        );
        
      }
    } catch (error) {
      console.error("❌ Error processing image:", error);
      setResponseText("⚠️ Failed to process the image.");
    } finally {
      setProcessing(false);
    }
  };
  
  

  return (
    <Container className="dashboard">
      {/* Top Bar */}
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
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="captured-image" />
        ) : (
          <video ref={videoRef} autoPlay playsInline className="camera-view" />
        )}
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
    <p dangerouslySetInnerHTML={{ __html: responseText.replace(/\n/g, "<br>") }} />
  </div>
)}


      {/* Loading Indicator */}
      {processing && <CircularProgress className="loading-spinner" />}

      {/* Background Overlay when Menu is Open */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>}

      {/* Floating Menu */}
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

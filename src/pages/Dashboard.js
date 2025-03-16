import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, IconButton, CircularProgress } from "@mui/material";
import { FaCamera, FaBars, FaHome, FaHistory, FaRecycle, FaMapMarkerAlt, FaSignOutAlt, FaRedo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase"; // Ensure Firestore is initialized
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Firestore imports
import "./Dashboard.css"; // External CSS for styling

const Dashboard = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    startCamera();
    return () => stopCamera(); // Stop camera on unmount
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setResponseText("⚠️ Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

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

    stopCamera(); // Stop camera after capturing
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
      console.log("📝 AI Response Received:", data);

      if (data.error) {
        setResponseText(`⚠️ Error: ${data.error}`);
      } else {
        console.log("Keys in Response:", Object.keys(data));

        setResponseText(`
          📦 Product: ${data["Product Name"] || "Unknown"}<br />
          🏭 Brand: ${data.Brand || "Unknown"}<br />
          ⚠️ Ingredients Impact: ${data["Ingredients Impact"] || "N/A"}<br />
          ♻️ Packaging Material: ${data["Packaging Material"] || "N/A"}<br />
          🌍 Carbon Footprint: ${data["Carbon Footprint"] || "N/A"}<br />
          🔄 Recycling Feasibility: ${data["Recycling Feasibility"] || "N/A"}<br />
          🌱 Alternative Options: ${data["Alternative Options"] || "None"}<br />
          ⭐ Sustainability Rating: ${data["Sustainability Rating"] || "N/A"}/5
        `);

        // 🔹 Save to Firestore
        saveHistoryToFirestore(data);
      }
    } catch (error) {
      console.error("❌ Error processing image:", error);
      setResponseText("⚠️ Failed to process the image.");
    } finally {
      setProcessing(false);
    }
  };

  // 🔹 Function to Save Scan Data in Firestore
  const saveHistoryToFirestore = async (aiResponse) => {
    const user = auth.currentUser; // Get logged-in user

    if (!user) {
      console.log("🚫 User not logged in, skipping history save.");
      return;
    }
    console.log("AI Response:", aiResponse);

    try {
      await addDoc(collection(db, "history"), {
        userId: user.uid, 
        productName: aiResponse["Product Name"] || "Unknown Product",
        brand: aiResponse["Brand"] || "Unknown Brand",
        sustainabilityScore: aiResponse["Sustainability Rating"] || "N/A",
        alternativeOptions: aiResponse["Alternative Options"],
        carbonFootprint: aiResponse["Carbon Footprint"], // ✅ Fix applied here
        ingredientsImpact: aiResponse["Ingredients Impact"],
        packagingMaterial: aiResponse["Packaging Material"],
        recyclingFeasibility: aiResponse["Recycling Feasibility"],
        recyclingtips: aiResponse["Recycling Tips"] || "No Tips Available",
        dateScanned: serverTimestamp(),
      });      

      console.log("✅ History saved successfully!");
    } catch (error) {
      console.error("❌ Error saving history:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    startCamera(); // Restart the camera
  };

  return (
    <Container className="dashboard">
      {/* Top Bar */}
      <div className="top-bar">
        <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          <FaBars />
        </IconButton>
        <Typography variant="h5" className="title">📷 Sustainaway Scanner </Typography>
        <IconButton className="sign-out-button" onClick={handleSignOut}>
          <FaSignOutAlt />
        </IconButton>
      </div>

      <div className="camera-container">
        {capturedImage ? (
          <>
            <img src={capturedImage} alt="Captured" className="captured-image" />
            <div className="retake-container">
              <IconButton className="retake-button" onClick={retakeImage}>
                <FaRedo />
              </IconButton>
            </div>
          </>
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
          <p dangerouslySetInnerHTML={{ __html: responseText }} />
        </div>
      )}

      {/* Loading Indicator */}
      {processing && <CircularProgress className="loading-spinner" />}

      {/* Floating Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => navigate("/")}> <FaHome /> Scanner </li>
          <li onClick={() => navigate("/history")}> <FaHistory /> History </li>
          <li onClick={() => { setMenuOpen(false); navigate("/recycle"); }}> <FaRecycle /> Recycle Guide </li>
          <li onClick={() => { setMenuOpen(false); navigate("/ngo-locator"); }}> <FaMapMarkerAlt />Recycle Centres</li>
          <li onClick={handleSignOut}><FaSignOutAlt /> Sign Out</li>
        </ul>
      </div>
    </Container>
  );
};

export default Dashboard;

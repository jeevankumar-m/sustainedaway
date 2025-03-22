import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, IconButton, CircularProgress } from "@mui/material";
import { FaBars, FaStore, FaHistory, FaFileInvoice, FaCamera, FaSignOutAlt, FaRedo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase"; // Ensure Firestore is initialized
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Firestore imports
import "./Dashboard.css"; // External CSS for styling

// Cloudinary configuration
const cloudinaryConfig = {
  cloudName: 'dgfepyx8a', // Replace with your Cloudinary cloud name
  uploadPreset: 'sustainedaway_preset' // Replace with your Cloudinary upload preset (optional)
};

// Sustainability Meter Component
const SustainabilityMeter = ({ rating }) => {
  // Ensure the rating is between 1 and 5
  const normalizedRating = Math.min(Math.max(rating, 1), 5);

  // Calculate the width of the filled area (20% per point)
  const width = (normalizedRating / 5) * 100;

  return (
    <div className="sustainability-meter">
      <div className="meter-bar">
        <div
          className="meter-fill"
          style={{ width: `${width}%`, backgroundColor: "#4CAF50" }} // Green color
        ></div>
      </div>
      <Typography variant="body1" className="meter-text">
        Sustainability Rating: {normalizedRating}/5
      </Typography>
    </div>
  );
};

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
      // Check if the device is mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Set constraints for the camera
      const constraints = {
        video: {
          facingMode: isMobile ? { exact: "environment" } : "user", // Use rear camera on mobile, front camera otherwise
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
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
    uploadImageToCloudinary(dataUrl);

    stopCamera(); // Stop camera after capturing
  };

  const uploadImageToCloudinary = async (dataUrl) => {
    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset); // Optional

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      console.log("Cloudinary Upload Response:", data); // Log Cloudinary response
      if (data.secure_url) {
        processImage(dataUrl.split(",")[1], data.secure_url); // Pass Cloudinary URL to processImage
      } else {
        console.error("Cloudinary URL not found in response:", data);
        setResponseText("⚠️ Failed to upload image to Cloudinary.");
      }
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      setResponseText("⚠️ Failed to upload image to Cloudinary.");
    }
  };

  const processImage = async (base64Image, imageUrl) => {
    setProcessing(true);
    setResponseText("");

    try {
      const response = await fetch("https://sustainedaway-backend.onrender.com/api/process-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });

      const data = await response.json();
      console.log("📝 AI Response Received:", data);

      if (data.error) {
        setResponseText(`⚠️ Error: ${data.error}`);
      } else {
        setResponseText(
          <>
            <Typography variant="h6">🧠 AI Response:</Typography>
            <p>
              📦 Product: {data["Product Name"] || "Unknown"}<br />
              🏭 Brand: {data.Brand || "Unknown"}<br />
              ⚠️ Ingredients Impact: {data["Ingredients Impact"] || "N/A"}<br />
              ♻️ Packaging Material: {data["Packaging Material"] || "N/A"}<br />
              🌍 Carbon Footprint: {data["Carbon Footprint"] || "N/A"}<br />
              🔄 Recycling Feasibility: {data["Recycling Feasibility"] || "N/A"}<br />
              🌱 Alternative Options: {data["Alternative Options"] || "None"}<br />
            </p>
            <SustainabilityMeter rating={parseFloat(data["Sustainability Rating"]) || 0} />
          </>
        );

        // Save to Firestore with Cloudinary URL
        saveHistoryToFirestore(data, imageUrl);
      }
    } catch (error) {
      console.error("❌ Error processing image:", error);
      setResponseText("⚠️ Failed to process the image.");
    } finally {
      setProcessing(false);
    }
  };

  const saveHistoryToFirestore = async (aiResponse, imageUrl) => {
    const user = auth.currentUser; // Get logged-in user

    if (!user) {
      console.log("🚫 User not logged in, skipping history save.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "history"), {
        userId: user.uid,
        productName: aiResponse["Product Name"] || "Unknown Product",
        brand: aiResponse["Brand"] || "Unknown Brand",
        sustainabilityScore: aiResponse["Sustainability Rating"] || "N/A",
        alternativeOptions: aiResponse["Alternative Options"],
        carbonFootprint: aiResponse["Carbon Footprint"],
        ingredientsImpact: aiResponse["Ingredients Impact"],
        packagingMaterial: aiResponse["Packaging Material"],
        recyclingFeasibility: aiResponse["Recycling Feasibility"],
        recyclingtips: aiResponse["Recycling Tips"] || "No Tips Available",
        imageUrl: imageUrl, // Cloudinary URL
        dateScanned: serverTimestamp(),
      });

      console.log("✅ History saved successfully! Document ID:", docRef.id);
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
          {responseText}
        </div>
      )}

      {/* Loading Indicator */}
      {processing && <CircularProgress className="loading-spinner" />}

      {/* Floating Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}> <FaCamera /> Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }}> <FaFileInvoice /> Bill Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }}> <FaStore /> Store Ratings </li>
          <li onClick={() => { setMenuOpen(false); navigate("/history"); }}> <FaHistory /> History </li>
          <li onClick={handleSignOut}> <FaSignOutAlt /> Sign Out </li>
        </ul>
      </div>
    </Container>
  );
};

export default Dashboard;
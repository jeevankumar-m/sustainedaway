import React, { useState, useRef, useEffect } from "react";
import { Typography, IconButton, CircularProgress } from "@mui/material";
import { FaBars, FaSignOutAlt, FaCamera, FaFileInvoice, FaStore, FaComments, FaHistory, FaRedo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./Dashboard.css";
import Loader from "../Loader";
import BackgroundIcons from "../BackgroundIcons";

// Cloudinary configuration
const cloudinaryConfig = {
  cloudName: 'dgfepyx8a',
  uploadPreset: 'sustainedaway_preset'
};

// Sustainability Meter Component
const SustainabilityMeter = ({ rating }) => {
  const normalizedRating = Math.min(Math.max(rating, 1), 5);
  const percentage = (normalizedRating / 5) * 100;

  return (
    <div className="gauge-meter">
      <div className="gauge">
        <div
          className="gauge-fill"
          style={{
            transform: `rotate(${(percentage / 100) * 180}deg)`,
          }}
        ></div>
        <div className="gauge-cover"></div>
        <div className="gauge-text">
          <Typography variant="body1" className="meter-text">
            {normalizedRating}/5
          </Typography>
        </div>
      </div>
      <Typography variant="body1" className="meter-label">
        Sustainability Rating
      </Typography>
    </div>
  );
};

const Scanner = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const aiResponseRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (aiResponseRef.current && responseText) {
      aiResponseRef.current.scrollTop = 0;
    }
  }, [responseText]);

  const startCamera = async () => {
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const constraints = {
        video: {
          facingMode: isMobile ? { exact: "environment" } : "user",
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

    stopCamera();
  };

  const uploadImageToCloudinary = async (dataUrl) => {
    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        processImage(dataUrl.split(",")[1], data.secure_url);
      } else {
        setResponseText("⚠️ Failed to upload image to Cloudinary.");
      }
    } catch (error) {
      setResponseText("⚠️ Failed to upload image to Cloudinary.");
    }
  };

  const processImage = async (base64Image, imageUrl) => {
    setProcessing(true);
    setResponseText("");

    try {
      const response = await fetch("https://sustainedaway-backend-wjom.onrender.com/api/process-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });

      const data = await response.json();

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
              ❤️ Health Impact: {data["Health Impact"] || "None"}<br />
            </p>
            <SustainabilityMeter rating={parseFloat(data["Sustainability Rating"]) || 0} />
          </>
        );

        saveHistoryToFirestore(data, imageUrl);
      }
    } catch (error) {
      setResponseText("⚠️ Failed to process the image.");
    } finally {
      setProcessing(false);
    }
  };

  const saveHistoryToFirestore = async (aiResponse, imageUrl) => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    try {
      await addDoc(collection(db, "history"), {
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
        healthimpact: aiResponse["Health Impact"] || "N/A",
        imageUrl: imageUrl,
        dateScanned: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving history:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {}
  };

  const retakeImage = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-50 to-green-200 overflow-hidden" style={{ fontFamily: 'SF Pro, San Francisco, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>
      <BackgroundIcons />
      {loading && <Loader />}
      {/* Full-width Enhanced Top Bar */}
      <div className="fixed top-0 left-0 w-full z-20">
        <div className="w-full flex items-center justify-between px-8 py-2 bg-gradient-to-r from-green-500 via-green-400 to-blue-300/80 backdrop-blur-lg shadow-lg border-b-2 border-green-200/40" style={{ minHeight: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button !text-white">
            <FaBars size={24} />
          </IconButton>
          <Typography variant="h6" className="font-bold tracking-tight text-white drop-shadow-lg" style={{ fontFamily: 'inherit', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            Scanner
          </Typography>
          <div style={{ width: 40 }} /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Floating Side Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""} z-30 fixed left-0 top-20`}>
        <ul className="pt-6 pb-4 px-2">
          <li onClick={() => { setMenuOpen(false); navigate("/scanner"); }} className="active mb-2">
            <span className="flex items-center gap-2 font-bold text-base text-white bg-gradient-to-r from-green-500 to-green-700 px-3 py-2 rounded-xl shadow-md">
              <FaCamera /> Scanner
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaFileInvoice /> Bill Scanner
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaStore /> Store Ratings
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/sustainavoice"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaComments /> SustainaVoice
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/history"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaHistory /> History
            </span>
          </li>
          <li onClick={handleSignOut} className="mt-4">
            <span className="flex items-center gap-2 font-semibold text-base text-red-700 hover:bg-red-100/60 px-3 py-2 rounded-xl transition-all">
              <FaSignOutAlt /> Sign Out
            </span>
          </li>
        </ul>
      </div>

      {/* Glassmorphic Card */}
      <div className="relative w-full max-w-md mx-auto rounded-3xl bg-white/30 backdrop-blur-lg border border-white/40 shadow-2xl flex flex-col items-stretch min-h-[80vh] overflow-hidden z-10 mt-20">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="w-full flex flex-col items-center">
            {capturedImage ? (
              <>
                <img src={capturedImage} alt="Captured" className="rounded-xl w-full max-w-xs mb-4 shadow" />
                <button onClick={retakeImage} className="mb-4 px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl font-bold shadow hover:from-green-500 hover:to-green-700 transition-all">Retake</button>
              </>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline className="rounded-xl w-full max-w-xs mb-4 bg-black/20" />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <button onClick={captureImage} className="mt-2 px-6 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl font-bold shadow hover:from-green-500 hover:to-green-700 transition-all flex items-center gap-2">
                  <FaCamera className="text-lg" />
                  Capture
                </button>
              </>
            )}
          </div>
          {/* Results */}
          {processing && <Loader />}
          {responseText && (
            <div ref={aiResponseRef} className="response-box mt-4">
              {responseText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner; 
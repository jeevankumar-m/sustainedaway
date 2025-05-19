import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, IconButton, Card, CardContent } from "@mui/material";
import { FaBars, FaSignOutAlt, FaRedo, FaCamera, FaFileInvoice, FaStore, FaComments, FaHistory } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "./Dashboard.css";
import "./Billscanner.css";
import Loader from "../Loader";
import BackgroundIcons from "../BackgroundIcons";

const BillScanner = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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
      setResponseData({ error: "⚠️ Camera access denied. Please grant permission and retry." });
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
    stopCamera();
    processImage(dataUrl.split(",")[1]);
  };

  const processImage = async (base64Image) => {
    setProcessing(true);
    setResponseData(null);
    try {
      const response = await fetch("https://sustainedaway-backend-2.onrender.com/api/process-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });
      const data = await response.json();
      if (data.error) {
        setResponseData({ error: `⚠️ Error: ${data.error}` });
      } else {
        setResponseData({ products: Array.isArray(data) ? data : [data] });
      }
    } catch (error) {
      setResponseData({ error: "⚠️ Failed to process the bill." });
    } finally {
      setProcessing(false);
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
      {/* Full-width Enhanced Top Bar, now flush with the top */}
      <div className="fixed top-0 left-0 w-full z-20">
        <div className="w-full flex items-center justify-between px-8 py-2 bg-gradient-to-r from-green-500 via-green-400 to-blue-300/80 backdrop-blur-lg shadow-lg border-b-2 border-green-200/40" style={{ minHeight: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button !text-white">
            <FaBars size={24} />
          </IconButton>
          <Typography variant="h6" className="font-bold tracking-tight text-white drop-shadow-lg" style={{ fontFamily: 'inherit', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            Bill Scanner
          </Typography>
          <div style={{ width: 40 }} /> {/* Spacer for symmetry */}
        </div>
      </div>
      {/* Floating Side Menu, now below the header */}
      <div className={`side-menu ${menuOpen ? "open" : ""} z-30 fixed left-0 top-20`}>
        <ul className="pt-6 pb-4 px-2">
          <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaCamera /> Scanner
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }} className="active mb-2">
            <span className="flex items-center gap-2 font-bold text-base text-white bg-gradient-to-r from-green-500 to-green-700 px-3 py-2 rounded-xl shadow-md">
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
        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center justify-center">
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
                <button onClick={captureImage} className="mt-2 px-6 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl font-bold shadow hover:from-green-500 hover:to-green-700 transition-all">Capture</button>
              </>
            )}
          </div>
          {/* Results */}
          {processing && <Loader />}
          {responseData && responseData.products && responseData.products.length > 0 ? (
            <div className="product-list w-full mt-4">
              {responseData.products.map((product, index) => (
                <Card key={index} className="product-card mb-4 rounded-xl shadow-lg bg-white/80">
                  <CardContent>
                    <Typography variant="h6" className="product-title">📦 {product["Product Name"]}</Typography>
                    <Typography><strong>🏭 Brand:</strong> {product.Brand || "Unknown"}</Typography>
                    <Typography><strong>🌱 Ingredients Impact:</strong> {product["Ingredients Impact"] || "N/A"}</Typography>
                    <Typography><strong>♻️ Packaging:</strong> {product["Packaging Material"] || "N/A"}</Typography>
                    <Typography><strong>🌍 Carbon Footprint:</strong> {product["Carbon Footprint"] || "N/A"}</Typography>
                    <Typography><strong>🔄 Recycling Feasibility:</strong> {product["Recycling Feasibility"] || "N/A"}</Typography>
                    <Typography><strong>✅ Alternative Options:</strong> {product["Alternative Options"] || "N/A"}</Typography>
                    <Typography><strong>🌎 Sustainability Rating:</strong> {product["Sustainability Rating"] || "N/A"}</Typography>
                    <Typography><strong>❤️ Health Impact:</strong> {product["Health Impact"] || "N/A"}</Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : responseData?.error ? (
            <Typography variant="body1" className="error-message mt-4">
              {responseData.error}
            </Typography>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BillScanner;

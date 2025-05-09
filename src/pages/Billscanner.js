import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, IconButton, CircularProgress, Card, CardContent } from "@mui/material";
import { FaBars, FaStore, FaHistory, FaFileInvoice, FaCamera, FaSignOutAlt, FaRedo, FaComments} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "./Dashboard.css";
import "./Billscanner.css";

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
      console.error("Error accessing camera:", error);
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
      // While Running the servers locally use "http://localhost:5001/api/process-bill"
      const response = await fetch("https://sustainedaway-backend-2.onrender.com/api/process-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });

      const data = await response.json();
      console.log("📝 AI Response Received:", data);

      if (data.error) {
        setResponseData({ error: `⚠️ Error: ${data.error}` });
      } else {
        // Ensure the response is treated as an array
        setResponseData({ products: Array.isArray(data) ? data : [data] });
      }
    } catch (error) {
      console.error("❌ Error processing image:", error);
      setResponseData({ error: "⚠️ Failed to process the bill." });
    } finally {
      setProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <Container className="bill-scanner">
      <div className="top-bar">
        <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          <FaBars />
        </IconButton>
        <Typography variant="h5" className="title">📄 Bill Scanner - Scan Your Bills To Know</Typography>
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

      <div className="capture-container">
        <IconButton className="capture-button" onClick={captureImage}>
          <FaCamera />
        </IconButton>
      </div>

      {responseData && responseData.products && responseData.products.length > 0 ? (
        <div className="product-list">
          {responseData.products.map((product, index) => (
            <Card key={index} className="product-card">
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
      ) : (
        <Typography variant="body1" className="error-message">
          {responseData?.error || "No products found."}
        </Typography>
      )}

      {processing && <CircularProgress className="loading-spinner" />}

      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => navigate("/")}> <FaCamera /> Scanner </li>
          <li onClick={() => navigate("/bill-scanner")} className="active"> <FaFileInvoice /> Bill Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }}> <FaStore /> Store Ratings </li>
          <li onClick={() => { setMenuOpen(false); navigate("/sustainavoice"); }}> <FaComments /> SustainaVoice </li>
          <li onClick={() => navigate("/history")}> <FaHistory /> History </li>
          <li onClick={handleSignOut}><FaSignOutAlt /> Sign Out</li>
        </ul>
      </div>
    </Container>
  );
};

export default BillScanner;

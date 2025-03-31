import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  IconButton, Typography, TextField, Button, Box, 
  CircularProgress, Select, MenuItem, InputLabel, 
  FormControl, Dialog, DialogActions, DialogContent, 
  DialogTitle
} from "@mui/material";
import { FaBars, FaSignOutAlt, FaCamera, FaFileInvoice, 
        FaStore, FaHistory, FaComments, FaTimes } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { auth, db } from "../firebase"; // Your Firebase config
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "./SustainaVoice.css";

const SustainaVoiceTest = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [productImage, setProductImage] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  const MAX_CHARACTERS = 280;

  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Start camera
  const startCamera = async () => {
    setCameraOpen(true);
    setCameraError(null);
    
    try {
      const constraints = {
        video: {
          facingMode: isMobile ? "environment" : "user", // Back camera on mobile, front on desktop
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setCameraError("Could not access camera. Please check permissions.");
      console.error("Camera error:", err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to image URL
      const imageUrl = canvas.toDataURL('image/jpeg');
      setProductImage(imageUrl);
      stopCamera();
    }
  };

  // Handle form submission with Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (feedback.trim() === "" || !auth.currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      const user = auth.currentUser;
      const feedbackData = {
        userId: user.uid,
        userEmail: user.email,
        feedbackType,
        feedback,
        productImage,
        createdAt: serverTimestamp()
      };
      
      // Save to Firestore
      const docRef = doc(db, "sustainabilityFeedback", `${user.uid}-${Date.now()}`);
      await setDoc(docRef, feedbackData);
      
      setIsSubmitting(false);
      setIsSuccess(true);
      setFeedback("");
      setCharacterCount(0);
      setProductImage(null);
      
      setTimeout(() => setIsSuccess(false), 3000);
      
      // Here you would add the X API integration to post the feedback
      console.log("Ready to post to X API:", feedbackData);
      
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ... (keep your existing handleFeedbackChange and other functions)
  const handleFeedbackChange = (e) => {
    const content = e.target.value;
    if (content.length <= MAX_CHARACTERS) {
      setFeedback(content);
      setCharacterCount(content.length);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="sustaina-voice-container">
      {/* Top Bar - Fixed Position */}
      <div className="top-bar">
        <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          <FaBars />
        </IconButton>
        <Typography variant="h5" className="title">💬 SustainaVoice</Typography>
      </div>

      {/* Floating Menu */}
      {menuOpen && <div className="menu-backdrop" onClick={() => setMenuOpen(false)}></div>}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          {/* ... (keep your existing menu items) */}
        </ul>
      </div>

      {/* Main Content */}
      <div className="voice-content">
        <Box sx={{ 
          width: '90%', 
          maxWidth: '500px', 
          bgcolor: 'background.paper', 
          p: 3, 
          borderRadius: 2, 
          boxShadow: 3,
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <FaXTwitter size={40} style={{ marginBottom: '16px' }} />
          <Typography variant="h5" gutterBottom>
            Share Your Product Feedback
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Help improve sustainability by sharing your thoughts!
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Image Upload/Capture */}
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              {productImage ? (
                <Box sx={{ position: 'relative' }}>
                  <img 
                    src={productImage} 
                    alt="Product" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px',
                      borderRadius: '8px'
                    }} 
                  />
                  <IconButton
                    onClick={() => setProductImage(null)}
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)'
                      }
                    }}
                  >
                    <FaTimes />
                  </IconButton>
                </Box>
              ) : (
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={startCamera}
                  sx={{ 
                    borderRadius: '8px',
                    py: 1.5,
                    mb: 1
                  }}
                >
                  Capture Product Photo
                </Button>
              )}
            </Box>

            {/* Camera Dialog */}
            <Dialog open={cameraOpen} onClose={stopCamera}>
              <DialogTitle>Capture Product Photo</DialogTitle>
              <DialogContent>
                {cameraError ? (
                  <Typography color="error">{cameraError}</Typography>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline
                      style={{
                        width: '100%',
                        borderRadius: '8px'
                      }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={stopCamera}>Cancel</Button>
                <Button 
                  onClick={capturePhoto} 
                  variant="contained"
                  disabled={!!cameraError}
                >
                  Capture
                </Button>
              </DialogActions>
            </Dialog>

            {/* ... (keep your existing feedback type dropdown and text field) */}
            <FormControl fullWidth sx={{ mb: 2, borderRadius: '8px' }}>
              <InputLabel id="feedback-type-label">Feedback Type</InputLabel>
              <Select
                labelId="feedback-type-label"
                value={feedbackType}
                label="Feedback Type"
                onChange={(e) => setFeedbackType(e.target.value)}
                sx={{ borderRadius: '8px' }}
              >
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="complaint">Complaint</MenuItem>
                <MenuItem value="suggestion">Suggestion</MenuItem>
              </Select>
            </FormControl>

            <TextField
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              placeholder="Share your thoughts on this product's sustainability... How could it be improved? What did you like?"
              value={feedback}
              onChange={handleFeedbackChange}
              sx={{ 
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
            
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                textAlign: 'right', 
                mb: 2,
                color: characterCount > MAX_CHARACTERS ? 'error.main' : 'text.secondary'
              }}
            >
              {characterCount}/{MAX_CHARACTERS}
            </Typography>

            

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={feedback.trim() === "" || characterCount > MAX_CHARACTERS || isSubmitting || !auth.currentUser}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <FaXTwitter />}
              sx={{ 
                py: 1.5,
                borderRadius: '8px'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Share Feedback'}
            </Button>
          </form>

          {isSuccess && (
            <Typography 
              variant="body1" 
              color="success.main" 
              sx={{ 
                mt: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px',
                p: 1,
                backgroundColor: 'rgba(46, 125, 50, 0.1)'
              }}
            >
              <span style={{ marginRight: '8px' }}>✓</span>
              Thank you for your feedback!
            </Typography>
          )}
        </Box>
      </div>
    </div>
  );
};

export default SustainaVoiceTest;
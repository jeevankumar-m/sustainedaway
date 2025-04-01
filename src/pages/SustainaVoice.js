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
import { postTweet } from '../twitterservice';
import Confetti from 'react-confetti';
import { signOut } from "firebase/auth";

const SustainaVoiceTest = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("review");
  const [tweetUrl, setTweetUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [productImage, setProductImage] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [productName, setProductName] = useState("");
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
  const compressImage = async (base64Str, quality = 0.7, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (feedback.trim() === "" || productName.trim() === "" || !auth.currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      const user = auth.currentUser;
      
      // Compress image if exists
      let compressedImage = null;
      if (productImage) {
        compressedImage = await compressImage(productImage);
      }
  
      // 1. Save original image to Firestore
      const feedbackData = {
        userId: user.uid,
        userEmail: user.email,
        productName, // Add product name to stored data
        feedbackType,
        feedback,
        productImage,
        createdAt: serverTimestamp()
      };

      const docRef = doc(db, "sustainabilityFeedback", `${user.uid}-${Date.now()}`);
      await setDoc(docRef, feedbackData);
      
      // 2. Post to Twitter with compressed image
      const generateHashtags = () => {
        const baseTags = ['SustainableProducts', 'EcoFeedback'];
        
        // Add conditional hashtags based on feedback type
        switch(feedbackType) {
          case 'complaint':
            baseTags.push('EcoConcern');
            break;
          case 'suggestion':
            baseTags.push('GreenInnovation');
            break;
          case 'review':
            baseTags.push('EcoReview');
            break;
          default:
            baseTags.push('SustainableLiving');
        }
        return baseTags.map(tag => `#${tag}`).join(' ');
      };
      
      // Map feedback types to display-friendly names
      const feedbackTypeLabels = {
        complaint: 'Complaint',
        suggestion: 'Suggestion', 
        review: 'Review',
        default: 'Feedback'
      };
      
      const tweetText = `${
        feedbackTypeLabels[feedbackType] || feedbackTypeLabels.default
      } about ${productName || "a product"} from @Sustainedaway user:\n\n"${
        feedback.substring(0, 180)
      }"\n\n${generateHashtags()}`;
  
      const result = await postTweet(tweetText, compressedImage);
      setTweetUrl(result.tweetUrl); // Store the URL
      // 3. Show success
      setIsSubmitting(false);
      setIsSuccess(true);
      setFeedback("");
      setProductName("");
      setCharacterCount(0);
      setProductImage(null);
      
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
      alert("Feedback saved, but Twitter post failed: " + err.message);
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
      {/* Floating Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}> <FaCamera /> Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }}> <FaFileInvoice /> Bill Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }}> <FaStore /> Store Ratings </li>
          <li onClick={() => { setMenuOpen(false); navigate("/sustainavoice"); }}> <FaComments /> SustainaVoice </li> 
          <li onClick={() => { setMenuOpen(false); navigate("/history"); }}> <FaHistory /> History </li>
          <li onClick={handleSignOut}> <FaSignOutAlt /> Sign Out </li>
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
                  mb: 1,
                  // Default state (black X theme)
                  color: 'white',
                  backgroundColor: 'black',
                  borderColor: 'black',
                  // Smooth transition for all animatable properties
                  transition: 'all 0.3s ease-in-out',
                  // Hover state
                  '&:hover': {
                    backgroundColor: '#111', // Slightly lighter black
                    borderColor: '#1d9bf0',  // Twitter's blue accent
                    boxShadow: '0 2px 8px rgba(29, 155, 240, 0.3)', // Subtle glow
                    transform: 'translateY(-1px)' // Slight lift effect
                  },
                  // Active/pressed state
                  '&:active': {
                    backgroundColor: '#222',
                    transform: 'translateY(0)'
                  },
                  // Focus state for accessibility
                  '&:focus-visible': {
                    outline: '2px solid #1d9bf0',
                    outlineOffset: '2px'
                  }
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

            {/* Add this above your feedback type dropdown */}
                        <TextField
              label="Product Name"
              fullWidth
              variant="outlined"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Bamboo Toothbrush or Recycled Notebook"
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
              required
            />

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
  fullWidth
  disabled={
    feedback.trim() === "" || 
    productName.trim() === "" || 
    characterCount > MAX_CHARACTERS || 
    isSubmitting || 
    !auth.currentUser || 
    isSuccess
  }
  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <FaXTwitter />}
  sx={{ 
    py: 1.5,
    borderRadius: '8px',
    backgroundColor: '#000000', // X/Twitter black
    color: '#FFFFFF', // White text
    textTransform: 'none', // Prevents uppercase transformation (optional)
    fontWeight: 'bold', // Makes text bolder (optional)
    transition: 'all 0.3s ease', // Smooth transition for hover effects
    '&:hover': {
      backgroundColor: '#000000', // Keep black but add a slight darkening effect
      opacity: 0.9, // Slightly transparent on hover
      transform: 'translateY(-1px)', // Subtle lift effect
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Soft shadow on hover
    },
    '&:active': {
      transform: 'translateY(0)', // Reset lift when clicked
    },
    '&:disabled': {
      backgroundColor: '#E5E5E5',
      color: '#A3A3A3',
      cursor: 'not-allowed',
    }
  }}
>
  {isSubmitting ? 'Submitting...' : 'Share Feedback'}
</Button>
          </form>

          {isSuccess && (
  <Box sx={{ 
    mt: 2,
    p: 2,
    border: '1px solid #e0e0e0',
    borderRadius: 2,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    position: 'relative' // Added for absolute positioning of close button
  }}>
    {/* Close button in top-right corner */}
    <IconButton
      sx={{
        position: 'absolute',
        right: 8,
        top: 8
      }}
      onClick={() => setIsSuccess(false)}
    >
      <FaTimes />
    </IconButton>
    
    <Confetti 
      width={window.innerWidth} 
      height={window.innerHeight} 
      recycle={false}
      numberOfPieces={200}
    />
    
    <Typography 
      variant="body1" 
      color="success.main"
      sx={{ mb: 2 }}
    >
      ✓ Feedback shared successfully!
    </Typography>

    {tweetUrl && (
            <Button
        variant="outlined"
        fullWidth
        onClick={() => window.open(tweetUrl, '_blank')}
        startIcon={<FaXTwitter />}
        sx={{
          mb: 2,
          py: 1.5,
          borderRadius: '8px',
          borderColor: '#000000', // X/Twitter black border
          color: '#000000', // Black text
          backgroundColor: 'transparent',
          textTransform: 'none', // Optional: prevents uppercase transformation
          fontWeight: 'bold', // Optional: makes text bolder
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)', // Very light black on hover
            borderColor: '#000000',
            color: '#000000',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        }}
      >
        View Your Tweet
      </Button>
    )}

      <Button
        variant="contained"
        fullWidth
        onClick={() => {
          setIsSuccess(false);
          setTweetUrl(null);
        }}
        startIcon={<FaComments />}
        sx={{
          py: 1.5,
          borderRadius: '8px',
          backgroundColor: '#000000', // X/Twitter black
          color: '#FFFFFF', // White text
          textTransform: 'none', // Prevents uppercase transformation
          fontWeight: 'bold', // Makes text bolder
          transition: 'all 0.3s ease', // Smooth transition
          '&:hover': {
            backgroundColor: '#000000', // Maintain black color
            opacity: 0.9, // Slightly transparent on hover
            transform: 'translateY(-1px)', // Subtle lift
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Soft shadow
          },
          '&:active': {
            transform: 'translateY(0)', // Reset when clicked
          },
          '& .MuiButton-startIcon': { // Style for the icon
            marginRight: '8px', // Adjust spacing between icon and text
          }
        }}
      >
        Share Another Feedback
      </Button>
  </Box>
)}
        </Box>
      </div>
    </div>
  );
};

export default SustainaVoiceTest;
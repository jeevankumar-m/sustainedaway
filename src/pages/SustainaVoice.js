import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  IconButton, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from "@mui/material";
import { FaBars, FaSignOutAlt, FaCamera, FaFileInvoice, FaStore, FaHistory, FaComments } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import "./SustainaVoice.css";

const SustainaVoiceTest = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [productImage, setProductImage] = useState(null);
  const navigate = useNavigate();

  const MAX_CHARACTERS = 280;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (feedback.trim() === "") return;
    
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      console.log("Feedback submitted:", { feedbackType, feedback, productImage });
      setIsSubmitting(false);
      setIsSuccess(true);
      setFeedback("");
      setCharacterCount(0);
      setProductImage(null);
      
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

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
          <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}> <FaCamera /> Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }}> <FaFileInvoice /> Bill Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }}> <FaStore /> Store Ratings </li>
          <li onClick={() => { setMenuOpen(false); navigate("/history"); }}> <FaHistory /> History </li>
          <li onClick={() => { setMenuOpen(false); navigate("/sustainavoice"); }}> <FaComments /> SustainaVoice </li>
          <li onClick={() => setMenuOpen(false)}> <FaSignOutAlt /> Sign Out </li>
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
            Share Your Product Feedback Anonymously
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Help improve sustainability by sharing your thoughts Anonymously!
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Image Upload */}
            <Box sx={{ mb: 2, textAlign: 'left' }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="product-image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="product-image-upload">
                <Button 
                  variant="outlined" 
                  component="span"
                  fullWidth
                  sx={{ 
                    borderRadius: '8px',
                    py: 1.5,
                    mb: 1
                  }}
                >
                  {productImage ? 'Change Product Photo' : 'Upload Product Photo'}
                </Button>
              </label>
              {productImage && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <img 
                    src={productImage} 
                    alt="Product" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '150px',
                      borderRadius: '8px'
                    }} 
                  />
                </Box>
              )}
            </Box>

            {/* Feedback Type Dropdown */}
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

            {/* Feedback Text */}
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
              disabled={feedback.trim() === "" || characterCount > MAX_CHARACTERS || isSubmitting}
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
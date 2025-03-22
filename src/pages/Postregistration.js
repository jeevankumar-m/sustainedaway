import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Typography, Container, Box, CircularProgress } from "@mui/material";

const PostRegistration = () => {
  const navigate = useNavigate();
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if the email is verified
        setIsEmailVerified(user.emailVerified);
      } else {
        // If the user is not logged in, redirect to the login page
        navigate("/login");
      }
      setLoading(false); // Stop loading once the check is complete
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [navigate]);

  const handleContinue = async () => {
    try {
      await signOut(auth); // Sign out the user
      navigate("/login"); // Redirect to the login page
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Checking your verification status...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
      <Box sx={{ padding: 4, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Thank You for Joining Us!
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          {isEmailVerified
            ? "Your email has been verified. Click the button below to continue."
            : "A verification link has been sent to your email. Please verify your email and refresh this page."}
        </Typography>
        {isEmailVerified && (
  <Button
    variant="contained"
    size="large"
    onClick={handleContinue}
    sx={{
      backgroundColor: "#4CAF50", // Green color
      color: "white", // Text color
      "&:hover": {
        backgroundColor: "#45a049", // Darker green on hover
      },
    }}
  >
    Continue
  </Button>
)}
      </Box>
    </Container>
  );
};

export default PostRegistration;
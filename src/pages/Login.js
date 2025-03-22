import "./Login.css";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import {
  Button,
  TextField,
  Container,
  Typography,
  Card,
  CardContent,
  Box,
} from "@mui/material";

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Used only for registration
  const [error, setError] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  const handleAuth = async () => {
    setError("");
    try {
      if (isRegistering) {
        // Register the user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Send email verification
        await sendEmailVerification(userCredential.user);

        // Redirect to the PostRegistration page
        navigate("/post-registration");
      } else {
        // Handle login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if the email is verified
        if (!userCredential.user.emailVerified) {
          setError("Please verify your email before logging in.");
          await signOut(auth); // Sign out the user if email is not verified
          return;
        }

        // Redirect to the dashboard if email is verified
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      if (!userCredential.user.emailVerified) {
        setError("Please verify your email before logging in.");
        await signOut(auth); // Sign out the user if email is not verified
        return;
      }
      navigate("/dashboard"); // Redirect after Google login
    } catch (err) {
      setError(err.message);
    }
  };

  // Check if the user's email is verified
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsEmailVerified(user.emailVerified);
      } else {
        setIsEmailVerified(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Container maxWidth="xs" className="auth-container">
      <Card className="auth-card">
        <CardContent>
          {/* Gradient Box for "Sustainedaway" */}
          <Box
            sx={{
              background: "linear-gradient(45deg, #4CAF50, #2E7D32)",
              padding: "16px",
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                color: "white",
                fontSize: "2.5rem",
              }}
            >
              Sustainedaway
            </Typography>
          </Box>

          {/* Rotating Globe */}
          <div className="earth-emoji">🌍</div>

          {/* Login/Register Title */}
          <Typography variant="h4" className="auth-title">
            {isRegistering ? "Create an Account" : "Login"}
          </Typography>

          {/* Name Field (Only for Registration) */}
          {isRegistering && (
            <TextField
              fullWidth
              label="Name"
              variant="outlined"
              margin="dense"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
            />
          )}

          {/* Email Field */}
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="dense"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />

          {/* Password Field */}
          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            margin="dense"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />

          {/* Error Message */}
          {error && <Typography color="error">{error}</Typography>}

          {/* Login/Sign Up Button */}
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            className="auth-button"
            onClick={handleAuth}
          >
            {isRegistering ? "Sign Up" : "Login"}
          </Button>

          {/* Google Sign-In Button */}
          <Button
            variant="contained"
            color="error"
            fullWidth
            sx={{ mt: 2 }}
            className="auth-button"
            onClick={handleGoogleSignIn}
          >
            Sign in with Google
          </Button>

          {/* Toggle Between Login and Register */}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              className="toggle-button"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
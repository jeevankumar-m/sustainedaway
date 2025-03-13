import "./Login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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
  const navigate = useNavigate(); // Hook for navigation

  const handleAuth = async () => {
    setError("");
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/dashboard"); // Redirect after successful login
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard"); // Redirect after Google login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="xs" className="auth-container">
      <Card className="auth-card">
        <CardContent>
        <div className="earth-emoji">🌍</div>

          <Typography variant="h4" className="auth-title">
            {isRegistering ? "Create an Account" : "Login"}
          </Typography>

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

          {error && <Typography color="error">{error}</Typography>}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            className="auth-button"
            onClick={handleAuth}
          >
            {isRegistering ? "Sign Up" : "Login"}
          </Button>

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

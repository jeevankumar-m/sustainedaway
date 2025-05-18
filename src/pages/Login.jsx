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
  sendPasswordResetEmail,
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const navigate = useNavigate();

  const showToast = (message, type) => {
    toast.dismiss();
    toast[type](message, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
      style: { backgroundColor: "#4CAF50", color: "#fff" },
    });
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        showToast("Verification email sent! Check your inbox.", "success");
        navigate("/post-registration");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          showToast("Please verify your email before logging in.", "error");
          await signOut(auth);
          return;
        }
        showToast("Login successful!", "success");
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        showToast("Invalid email format.", "error");
      } else if (err.code === "auth/user-not-found") {
        showToast("No account found with this email.", "error");
      } else if (err.code === "auth/wrong-password") {
        showToast("Incorrect password.", "error");
      } else {
        showToast(err.message, "error");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      if (!userCredential.user.emailVerified) {
        showToast("Please verify your email before logging in.", "error");
        await signOut(auth);
        return;
      }
      showToast("Login successful!", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast("Please enter your email to reset password.", "error");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent. Check your inbox.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsEmailVerified(user ? user.emailVerified : false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Container maxWidth="xs" className="auth-container">
      <ToastContainer />
      <Card className="auth-card">
        <CardContent>
          <Box sx={{
            background: "linear-gradient(45deg, #4CAF50, #2E7D32)",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center",
            marginBottom: "16px",
          }}>
            <Typography variant="h2" sx={{ fontWeight: "bold", color: "white", fontSize: "2.5rem" }}>
              Sustainedaway
            </Typography>
          </Box>

          <div className="earth-emoji">
          <img src="./favicon.ico" alt="Earth" className="earth-image" />
          </div>

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
              placeholder="John Doe"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4CAF50',
                    boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)'
                  },
                },
              }}
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
            placeholder="example@gmail.com"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#4CAF50',
                  boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)'
                },
              },
            }}
          />

          <TextField 
            fullWidth 
            label="Password" 
            variant="outlined" 
            margin="dense" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#4CAF50',
                  boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)'
                },
              },
            }}
          />

          {!isRegistering && (
            <Button 
              onClick={handleForgotPassword} 
              sx={{ 
                mt: 1,
                color: '#56ab2f',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#2b580c',
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                  boxShadow: '0 2px 4px rgba(86, 171, 47, 0.3)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Forgot Password?
            </Button>
          )}

          <Button 
            variant="contained" 
            fullWidth 
            sx={{ 
              mt: 2,
              backgroundColor: '#4CAF50',
              '&:hover': {
                backgroundColor: '#3e8e41',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              },
              transition: 'all 0.3s ease'
            }} 
            onClick={handleAuth}
          >
            {isRegistering ? "Sign Up" : "Login"}
          </Button>

          <Button 
            variant="contained" 
            fullWidth 
            sx={{ 
              mt: 2,
              backgroundColor: '#DB4437',
              '&:hover': {
                backgroundColor: '#c1351d',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              },
              transition: 'all 0.3s ease'
            }} 
            onClick={handleGoogleSignIn}
          >
            Sign in with Google
          </Button>

          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{
                color: '#4CAF50',
                borderColor: '#4CAF50',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  borderColor: '#3e8e41',
                  color: '#3e8e41',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.3s ease'
              }}
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
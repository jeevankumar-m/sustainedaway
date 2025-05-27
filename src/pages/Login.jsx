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
import { TextField, InputAdornment } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import Loader from "../Loader";
import { FcGoogle } from 'react-icons/fc';
import { motion } from "framer-motion";

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
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
          setLoading(false);
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
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      if (!userCredential.user.emailVerified) {
        showToast("Please verify your email before logging in.", "error");
        await signOut(auth);
        setLoading(false);
        return;
      }
      showToast("Login successful!", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.message, "error");
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast("Please enter your email to reset password.", "error");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent. Check your inbox.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsEmailVerified(user ? user.emailVerified : false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-green-50 overflow-hidden" style={{fontFamily: 'SF Pro, San Francisco, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'}}>
      {/* Top Curved Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-60 bg-gradient-to-br from-green-300 via-green-100 to-blue-200 rounded-b-[60vw] blur-2xl opacity-80 z-0" />
      {/* Bottom Curved Background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120vw] h-60 bg-gradient-to-tr from-green-200 via-green-100 to-blue-200 rounded-t-[60vw] blur-2xl opacity-80 z-0" />
      <ToastContainer />
      <div className="relative w-full max-w-[400px] mx-auto flex flex-col justify-center min-h-screen p-4 z-10">
        <div className="relative">
          {/* Loader overlays the card */}
          {loading && <Loader />}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="bg-white/30 backdrop-blur-lg border border-white/40 shadow-2xl rounded-3xl px-6 py-8 flex flex-col items-center"
          >
   {/* Logo - Earth image only, no background circle */}
   <img 
     src="./favicon.ico" 
     alt="Earth" 
     className="w-24 h-24 mb-4 object-contain animate-float mx-auto"
   />
            <h1 className="text-3xl font-bold text-green-800 mb-1 tracking-tight">Sustainedaway</h1>
            <p className="text-green-700 text-base mb-6 font-medium text-center">
              {isRegistering ? "Join our sustainable journey" : "Welcome back!"}
            </p>
            <div className="w-full flex flex-col gap-5">
              {isRegistering && (
                <TextField 
                  fullWidth 
                  label="Name" 
                  variant="outlined" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="John Doe"
                  className="custom-input"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FaUser className="text-green-500" />
                      </InputAdornment>
                    ),
                    className: "bg-white/60 rounded-xl"
                  }}
                />
              )}
              <TextField 
                fullWidth 
                label="Email" 
                variant="outlined" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@gmail.com"
                className="custom-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaEnvelope className="text-green-500" />
                    </InputAdornment>
                  ),
                  className: "bg-white/60 rounded-xl"
                }}
              />
              <TextField 
                fullWidth 
                label="Password" 
                variant="outlined" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="custom-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock className="text-green-500" />
                    </InputAdornment>
                  ),
                  className: "bg-white/60 rounded-xl"
                }}
              />
              {!isRegistering && (
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); handleForgotPassword(); }}
                  className="block w-full text-right mb-1 text-sm font-semibold transition-all duration-200 hover:underline focus:underline cursor-pointer"
                  style={{ color: '#2563eb', background: 'none', boxShadow: 'none' }}
                >
                  Forgot Password?
                </a>
              )}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleAuth}
                className="w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center text-base tracking-wide transition-all duration-200 hover:from-green-500 hover:to-green-700 hover:shadow-2xl active:scale-95 focus:ring-2 focus:ring-green-300"
                disabled={loading}
              >
                {isRegistering ? "SIGN UP" : "LOGIN"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleGoogleSignIn}
                className="w-full font-bold py-3 rounded-xl shadow-lg flex items-center justify-center text-base tracking-wide border border-gray-200 gap-2 transition-all duration-200 hover:bg-gray-100 hover:shadow-2xl active:scale-95"
                style={{ color: '#000', background: '#fff' }}
                disabled={loading}
              >
                <FcGoogle className="text-xl" />
                <span>SIGN IN WITH GOOGLE</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full bg-gradient-to-r from-rose-400 via-red-400 to-red-500 text-white font-bold text-base rounded-xl py-3 shadow-lg flex items-center justify-center tracking-wide mt-1 transition-all duration-200 hover:from-red-500 hover:to-rose-500 hover:shadow-2xl active:scale-95"
                disabled={loading}
              >
                {isRegistering ? "ALREADY HAVE AN ACCOUNT? LOGIN" : "DON'T HAVE AN ACCOUNT? REGISTER"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
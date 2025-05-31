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
import { TextField, InputAdornment, CircularProgress } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaArrowLeft,
  FaLeaf,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";

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
      position: "bottom-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
      style: {
        backgroundColor: type === "success" ? "#10B981" : "#EF4444",
        color: "#fff",
      },
    });
  };

  const handleAuth = async () => {
    if (!email || !password || (isRegistering && !name)) {
      showToast("Please fill all required fields", "error");
      return;
    }
    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await sendEmailVerification(userCredential.user);
        showToast("Verification email sent! Check your inbox.", "success");
        navigate("/post-registration");
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
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
    <div className="relative min-h-screen w-full flex flex-col md:flex-row items-stretch bg-slate-50 font-sans overflow-hidden">
      {/* Background - Left Side */}
      <div className="hidden md:flex md:w-5/12 lg:w-6/12 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-patterns opacity-10"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute top-20 right-20 w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm"></div>

        <div className="relative z-10 h-full flex flex-col justify-center items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaLeaf className="text-white text-3xl" />
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                Sustainedaway
              </h1>
            </div>
            <p className="text-white/90 text-lg lg:text-xl max-w-md">
              Join our community dedicated to sustainable living and
              environmental consciousness.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/10 backdrop-blur-md p-6 rounded-2xl w-full max-w-md"
          >
            <h2 className="text-white text-lg font-medium mb-3">
              Why join us?
            </h2>
            <ul className="text-white/80 space-y-2">
              <li className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-green-400/20 flex items-center justify-center mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span>Track your carbon footprint</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-green-400/20 flex items-center justify-center mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span>Connect with eco-conscious community</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-green-400/20 flex items-center justify-center mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <span>Learn sustainable living practices</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative">
        {/* Mobile Back Button */}
        <motion.button
          className="absolute top-6 left-6 z-20 text-gray-700 md:hidden bg-white/90 backdrop-blur-md rounded-full p-3 shadow-lg hover:bg-white"
          onClick={() => navigate("/")}
          aria-label="Back to landing page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft className="text-emerald-600" />
        </motion.button>

        <ToastContainer />

        <div className="w-full max-w-md mx-auto">
          <motion.div
            className="w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 md:p-10 border border-white/40"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Mobile Logo (visible on small screens only) */}
            <div className="flex justify-center md:hidden mb-8">
              <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg">
                <FaLeaf className="text-white text-3xl" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 text-center md:text-left tracking-tight">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-500 mb-6 text-center md:text-left">
              {isRegistering
                ? "Join our sustainable journey"
                : "Sign in to your account"}
            </p>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {isRegistering && (
                  <motion.div
                    key="nameField"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TextField
                      fullWidth
                      label="Full Name"
                      variant="outlined"
                      className="mb-4"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FaUser className="text-emerald-500" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "1rem",
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)",
                          },
                        },
                        "& .MuiOutlinedInput-root.Mui-focused": {
                          boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
                        },
                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                          {
                            borderColor: "#10B981",
                            borderWidth: "2px",
                          },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#10B981",
                        },
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-4">
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                className="mb-4"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaEnvelope className="text-emerald-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)",
                    },
                  },
                  "& .MuiOutlinedInput-root.Mui-focused": {
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#10B981",
                      borderWidth: "2px",
                    },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#10B981",
                  },
                }}
              />
              </div>

              <div className="mb-4">
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                className="mb-4"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock className="text-emerald-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.06)",
                    },
                  },
                  "& .MuiOutlinedInput-root.Mui-focused": {
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#10B981",
                      borderWidth: "2px",
                    },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#10B981",
                  },
                }}
              />
              </div>

              <div className="mb-4">
              {!isRegistering && (
                <motion.div
                  className="flex justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <button
                    onClick={handleForgotPassword}
                    className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white/80 rounded-lg px-2 py-1"
                    type="button"
                  >
                    Forgot password?
                  </button>
                </motion.div>
              )}
              </div>

              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 8px 20px rgba(16, 185, 129, 0.25)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAuth}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold py-3.5 rounded-xl shadow-md flex items-center justify-center space-x-2 hover:from-emerald-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 transition-all duration-200 mt-2"
                disabled={loading}
                type="button"
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <span className="text-base">
                    {isRegistering ? "Create account" : "Sign in"}
                  </span>
                )}
              </motion.button>

              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-gray-200/70 absolute w-full"></div>
                <span className="bg-white/80 px-4 py-1 text-xs font-medium text-gray-500 relative rounded-full">
                  Or continue with
                </span>
              </div>

              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 6px 15px rgba(0, 0, 0, 0.08)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                className="w-full bg-white text-gray-700 font-medium py-3.5 rounded-xl shadow-sm flex items-center justify-center space-x-3 border border-gray-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200"
                disabled={loading}
                type="button"
              >
                <FcGoogle className="text-xl" />
                <span>Google</span>
              </motion.button>

              <div className="text-center pt-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sm md:text-base text-emerald-600 hover:text-emerald-800 font-medium transition-colors bg-emerald-50/50 hover:bg-emerald-50 py-2 px-4 rounded-lg"
                  type="button"
                >
                  {isRegistering
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;

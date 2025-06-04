import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { postTweet } from "../twitterservice";
import Confetti from "react-confetti";
import Loader from "../Loader";
import {
  FaBars,
  FaSignOutAlt,
  FaCamera,
  FaFileInvoice,
  FaStore,
  FaHistory,
  FaComments,
  FaTimes,
  FaLeaf,
  FaImage,
  FaPaperPlane,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import BackgroundIcons from "../BackgroundIcons";
import { moderateUserContent } from "../utils/contentModeration";

const SustainaVoice = () => {
  // State variables
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
  const [loading, setLoading] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const MAX_CHARACTERS = 280;

  // Detect mobile devices
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Start camera function
  const startCamera = async () => {
    setCameraOpen(true);
    setCameraError(null);

    try {
      const constraints = {
        video: {
          facingMode: isMobile ? "environment" : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
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

  // Stop camera function
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Capture photo function
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageUrl = canvas.toDataURL("image/jpeg");
      setProductImage(imageUrl);
      stopCamera();
    }
  };

  // Image compression function
  const compressImage = async (base64Str, quality = 0.7, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    });
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    // Moderate product name
    const productNameModeration = moderateUserContent(productName, 'voice');
    if (!productNameModeration.isClean) {
      alert(productNameModeration.reason);
      return;
    }

    // Moderate feedback content
    const feedbackModeration = moderateUserContent(feedback, 'voice');
    if (!feedbackModeration.isClean) {
      alert(feedbackModeration.reason);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;

      // Compress image if exists
      let compressedImage = null;
      if (productImage) {
        compressedImage = await compressImage(productImage);
      }

      // Save to Firestore with sanitized content
      const feedbackData = {
        userId: user.uid,
        userEmail: user.email,
        productName: productNameModeration.sanitizedContent,
        feedbackType,
        feedback: feedbackModeration.sanitizedContent,
        productImage,
        createdAt: serverTimestamp(),
      };

      const docRef = doc(
        db,
        "sustainabilityFeedback",
        `${user.uid}-${Date.now()}`
      );
      await setDoc(docRef, feedbackData);

      // Generate hashtags for Twitter
      const generateHashtags = () => {
        const baseTags = ["SustainableProducts", "EcoFeedback"];

        switch (feedbackType) {
          case "complaint":
            baseTags.push("EcoConcern");
            break;
          case "suggestion":
            baseTags.push("GreenInnovation");
            break;
          case "review":
            baseTags.push("EcoReview");
            break;
          default:
            baseTags.push("SustainableLiving");
        }
        return baseTags.map((tag) => `#${tag}`).join(" ");
      };

      // Map feedback types to display names
      const feedbackTypeLabels = {
        complaint: "Complaint",
        suggestion: "Suggestion",
        review: "Review",
        default: "Feedback",
      };

      // Create tweet text with sanitized content
      const tweetText = `${
        feedbackTypeLabels[feedbackType] || feedbackTypeLabels.default
      } about ${
        productNameModeration.sanitizedContent || "a product"
      } from @Sustainedaway user:\n\n"${feedbackModeration.sanitizedContent.substring(
        0,
        180
      )}"\n\n${generateHashtags()}`;

      // Post to Twitter
      const result = await postTweet(tweetText, compressedImage);
      setTweetUrl(result.tweetUrl);

      // Reset form and show success
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
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle feedback text change with moderation
  const handleFeedbackChange = (e) => {
    const content = e.target.value;
    if (content.length <= MAX_CHARACTERS) {
      setFeedback(content);
      setCharacterCount(content.length);
    }
  };

  // Handle product name change with moderation
  const handleProductNameChange = (e) => {
    const content = e.target.value;
    setProductName(content);
  };

  // Handle file upload from device
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50/30 font-sans relative">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20 pointer-events-none">
        <BackgroundIcons />
      </div>

      {loading && <Loader />}

      {/* Overlay when menu is open on mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-lg px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-50 text-green-600 md:hidden"
          >
            <FaBars className="text-lg" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white">
              <FaComments className="text-sm" />
            </div>
            <h1 className="font-bold text-green-800">SustainaVoice</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                signOut(auth);
                navigate("/login");
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="text-sm" />
              <span className="text-sm font-medium">Logout</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              {auth.currentUser?.photoURL ? (
                <img
                  src={auth.currentUser.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-medium text-sm">
                  {auth.currentUser?.displayName?.charAt(0) || "U"}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Side Navigation */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-sm z-40 transform transition-all duration-300 ease-in-out ${
          menuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } md:translate-x-0 md:shadow-xl pt-20`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 px-3 py-6">
            {/* User profile area */}
            <div className="mb-8 px-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-md">
                  {auth.currentUser?.photoURL ? (
                    <img
                      src={auth.currentUser.photoURL}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {auth.currentUser?.displayName?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {auth.currentUser?.displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[160px]">
                    {auth.currentUser?.email || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 pl-2">
                Main menu
              </p>
              <ul className="space-y-2.5">
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/dashboard");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaCamera className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Scanner</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/bill-scanner");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaFileInvoice className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Bill scanner</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/store-ratings");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaStore className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Store ratings</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/sustainavoice");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <FaComments className="text-white text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>SustainaVoice</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/history");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaHistory className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>History</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider with pattern */}
          <div className="px-6 py-2">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          </div>

          {/* Sign out section */}
          <div className="p-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <FaSignOutAlt className="text-red-500 text-sm group-hover:rotate-12 transition-transform" />
              </div>
              <span className="text-gray-600 group-hover:text-red-600 transition-colors">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4 md:pl-72 transition-all duration-300">
        <div className="max-w-xl mx-auto">
          {/* Title Section */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Share Your Sustainability Feedback
            </h2>
            <p className="text-gray-600">
              Help improve products by sharing your thoughts on Twitter
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black">
                  <FaXTwitter className="text-white text-xl" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Product Image */}
                <div className="mb-5">
                  {productImage ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={productImage}
                        alt="Product"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setProductImage(null)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <FaTimes size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 py-3 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <FaCamera className="text-lg" />
                        <span>Take Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="flex-1 py-3 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <FaImage className="text-lg" />
                        <span>Upload Image</span>
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <div className="mb-4">
                  <label
                    htmlFor="product-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Product Name
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    value={productName}
                    onChange={handleProductNameChange}
                    placeholder="e.g. Bamboo Toothbrush"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                {/* Feedback Type */}
                <div className="mb-4">
                  <label
                    htmlFor="feedback-type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Feedback Type
                  </label>
                  <select
                    id="feedback-type"
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all appearance-none bg-no-repeat bg-right pr-10"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                      backgroundSize: "1.5em",
                    }}
                  >
                    <option value="review">Review</option>
                    <option value="complaint">Complaint</option>
                    <option value="suggestion">Suggestion</option>
                  </select>
                </div>

                {/* Feedback Content */}
                <div className="mb-1">
                  <label
                    htmlFor="feedback"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Feedback
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={handleFeedbackChange}
                    placeholder="Share your thoughts on this product's sustainability..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                    rows="4"
                    required
                  />
                  <div className="flex justify-end mt-1">
                    <span
                      className={`text-xs ${
                        characterCount > MAX_CHARACTERS - 50
                          ? characterCount > MAX_CHARACTERS
                            ? "text-red-500"
                            : "text-amber-500"
                          : "text-gray-500"
                      }`}
                    >
                      {characterCount}/{MAX_CHARACTERS}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    feedback.trim() === "" ||
                    productName.trim() === "" ||
                    characterCount > MAX_CHARACTERS ||
                    isSubmitting ||
                    !auth.currentUser
                  }
                  className="w-full py-3 px-4 bg-black text-white rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FaXTwitter className="text-lg" />
                      <span>Share Feedback</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6 relative">
              {/* Confetti animation */}
              <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                recycle={false}
                numberOfPieces={200}
              />

              <div className="p-6">
                <button
                  onClick={() => setIsSuccess(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <FaTimes size={16} />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <FaLeaf className="text-green-500 text-2xl" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Feedback Shared Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your sustainability feedback has been posted to Twitter
                  </p>

                  {tweetUrl && (
                    <a
                      href={tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 border border-black text-black rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors mb-4"
                    >
                      <FaXTwitter className="text-lg" />
                      <span>View Your Tweet</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setTweetUrl(null);
                    }}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                  >
                    <FaPaperPlane className="text-lg" />
                    <span>Share Another Feedback</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FaLeaf className="text-green-500" />
                About SustainaVoice
              </h3>

              <p className="text-gray-600 mb-4">
                SustainaVoice lets you share your thoughts on sustainable
                products directly to Twitter. Your feedback helps companies
                improve their environmental practices.
              </p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Take a photo or upload an image of the product</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>
                    Share reviews, complaints, or suggestions about
                    sustainability
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>
                    Your feedback gets posted to Twitter with relevant hashtags
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Camera Dialog */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Take Product Photo</h3>
              <button
                onClick={stopCamera}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-4">
              {cameraError ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <FaTimes className="text-red-500 text-2xl" />
                  </div>
                  <p className="text-red-600 mb-2">{cameraError}</p>
                  <p className="text-gray-600 text-sm">
                    Please check your camera permissions and try again.
                  </p>
                </div>
              ) : (
                <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={stopCamera}
                className="py-2 px-4 text-gray-700 rounded-lg mr-2 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                disabled={!!cameraError}
              >
                Take Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center py-2 px-3 text-gray-500"
          >
            <FaCamera />
            <span className="text-xs mt-1">Scan</span>
          </button>

          <button
            onClick={() => navigate("/bill-scanner")}
            className="flex flex-col items-center py-2 px-3 text-gray-500"
          >
            <FaFileInvoice />
            <span className="text-xs mt-1">Bills</span>
          </button>

          <button
            onClick={() => navigate("/store-ratings")}
            className="flex flex-col items-center py-2 px-3 text-gray-500"
          >
            <FaStore />
            <span className="text-xs mt-1">Stores</span>
          </button>

          <button
            onClick={() => navigate("/sustainavoice")}
            className="flex flex-col items-center py-2 px-3 text-green-600"
          >
            <FaComments />
            <span className="text-xs mt-1">Voice</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default SustainaVoice;

import React, { useState, useRef, useEffect } from "react";
import {
  FaBars,
  FaSignOutAlt,
  FaRedo,
  FaCamera,
  FaFileInvoice,
  FaStore,
  FaComments,
  FaHistory,
  FaLeaf,
  FaTimes,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import BackgroundIcons from "../BackgroundIcons";

// Spinner component for loading states
const Spinner = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

// Status badge component
const StatusBadge = ({ text }) => {
  // Determine color based on content
  const getColor = () => {
    if (!text) return "bg-gray-100 text-gray-500";
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("good") ||
      lowerText.includes("excellent") ||
      lowerText.includes("high")
    )
      return "bg-green-100 text-green-800";
    if (
      lowerText.includes("moderate") ||
      lowerText.includes("medium") ||
      lowerText.includes("average")
    )
      return "bg-yellow-100 text-yellow-800";
    if (
      lowerText.includes("poor") ||
      lowerText.includes("low") ||
      lowerText.includes("bad")
    )
      return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <span className={`${getColor()} px-2 py-1 rounded-md text-xs font-medium`}>
      {text || "Not available"}
    </span>
  );
};

const BillScanner = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const constraints = {
        video: {
          facingMode: isMobile ? { exact: "environment" } : "user",
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureImage = () => {
    if (cameraError) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);
    stopCamera();
    processImage(dataUrl.split(",")[1]);
  };

  const processImage = async (base64Image) => {
    setProcessing(true);
    setResponseData(null);

    try {
      const response = await fetch(
        "https://sustainedaway-backend-gulo.onrender.com/api/process-bill",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image }),
        }
      );

      const data = await response.json();

      if (data.error) {
        setResponseData({ error: data.error });
      } else {
        setResponseData({ products: Array.isArray(data) ? data : [data] });
      }
    } catch (error) {
      setResponseData({ error: "Failed to process the bill" });
    } finally {
      setProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    setResponseData(null);
    startCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50/30 font-sans">
      {/* Semi-transparent overlay when menu is open on mobile */}
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
              <FaFileInvoice className="text-sm" />
            </div>
            <h1 className="font-bold text-green-800">Bill Scanner</h1>
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
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <FaFileInvoice className="text-white text-sm group-hover:scale-110 transition-transform" />
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
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaComments className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Sustainavoice</span>
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
              onClick={() => {
                signOut(auth);
                navigate("/login");
              }}
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
      <main className="pt-20 pb-6 px-4 md:pl-72 transition-all duration-300">
        <div className="max-w-xl mx-auto">
          {/* Camera Card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-5">
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-800 mb-3">
                Scan your receipt
              </h2>

              <div className="bg-black rounded-xl overflow-hidden aspect-[4/3] relative">
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                ) : cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
                    <FaTimes className="text-red-500 text-2xl mb-2" />
                    <p className="text-center mb-2">Camera access denied</p>
                    <button
                      onClick={startCamera}
                      className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white flex items-center gap-2 text-sm"
                    >
                      <FaRedo className="text-xs" />
                      <span>Retry</span>
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-3 mt-4">
                {capturedImage ? (
                  <button
                    onClick={retakeImage}
                    disabled={processing}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaRedo />
                    <span>Retake</span>
                  </button>
                ) : (
                  <button
                    onClick={captureImage}
                    disabled={cameraError}
                    className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow
                      ${
                        cameraError
                          ? "bg-gray-300 text-gray-500"
                          : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:from-green-600 hover:to-green-700"
                      } transition-all`}
                  >
                    <FaCamera />
                    <span>Capture Receipt</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Processing indicator */}
          {processing && (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-5 text-center">
              <Spinner />
              <p className="mt-2 text-gray-600">Analyzing your receipt...</p>
            </div>
          )}

          {/* Results Card */}
          {responseData && !processing && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-5">
              {responseData.error ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <FaTimes className="text-red-500 text-xl" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    Analysis Failed
                  </h3>
                  <p className="text-gray-600 mb-4">{responseData.error}</p>
                  <button
                    onClick={retakeImage}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div>
                  <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <h2 className="font-bold text-xl">Receipt Analysis</h2>
                    <p className="text-green-100">
                      {responseData.products.length}{" "}
                      {responseData.products.length === 1
                        ? "product"
                        : "products"}{" "}
                      found
                    </p>
                  </div>

                  <div className="p-4">
                    <div className="space-y-4">
                      {responseData.products.map((product, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-medium text-gray-800">
                              {product["Product Name"] || "Unknown Product"}
                            </h3>
                            <StatusBadge
                              text={
                                product["Sustainability Rating"]
                                  ? `Rating: ${product["Sustainability Rating"]}`
                                  : "No Rating"
                              }
                            />
                          </div>

                          <div className="p-4 space-y-3">
                            {product["Brand"] && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 text-sm min-w-[130px]">
                                  Brand:
                                </span>
                                <span className="text-gray-800 text-sm">
                                  {product["Brand"]}
                                </span>
                              </div>
                            )}

                            {product["Ingredients Impact"] && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 text-sm min-w-[130px]">
                                  Ingredients Impact:
                                </span>
                                <StatusBadge
                                  text={product["Ingredients Impact"]}
                                />
                              </div>
                            )}

                            {product["Packaging Material"] && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 text-sm min-w-[130px]">
                                  Packaging:
                                </span>
                                <span className="text-gray-800 text-sm">
                                  {product["Packaging Material"]}
                                </span>
                              </div>
                            )}

                            {product["Carbon Footprint"] && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 text-sm min-w-[130px]">
                                  Carbon Footprint:
                                </span>
                                <StatusBadge
                                  text={product["Carbon Footprint"]}
                                />
                              </div>
                            )}

                            {product["Recycling Feasibility"] && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 text-sm min-w-[130px]">
                                  Recycling:
                                </span>
                                <StatusBadge
                                  text={product["Recycling Feasibility"]}
                                />
                              </div>
                            )}

                            {product["Alternative Options"] && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="text-gray-500 text-sm mb-1">
                                  Sustainable Alternatives:
                                </div>
                                <p className="text-gray-800 text-sm">
                                  {product["Alternative Options"]}
                                </p>
                              </div>
                            )}

                            {product["Health Impact"] && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="text-gray-500 text-sm mb-1">
                                  Health Impact:
                                </div>
                                <p className="text-gray-800 text-sm">
                                  {product["Health Impact"]}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
                    <button
                      onClick={retakeImage}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-1.5 text-sm"
                    >
                      <FaRedo className="text-xs" />
                      <span>Scan again</span>
                    </button>

                    <button
                      onClick={() => navigate("/history")}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex items-center gap-1.5 text-sm"
                    >
                      <FaHistory className="text-xs" />
                      <span>View history</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation for mobile */}
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
            className="flex flex-col items-center py-2 px-3 text-green-600"
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
            onClick={() => navigate("/history")}
            className="flex flex-col items-center py-2 px-3 text-gray-500"
          >
            <FaHistory />
            <span className="text-xs mt-1">History</span>
          </button>
        </div>
      </nav>

      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20 pointer-events-none">
        <BackgroundIcons />
      </div>
    </div>
  );
};

export default BillScanner;

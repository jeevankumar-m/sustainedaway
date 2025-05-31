import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import {
  FaCheckCircle,
  FaEnvelope,
  FaArrowRight,
  FaLeaf,
} from "react-icons/fa";
import BackgroundIcons from "../BackgroundIcons";

const PostRegistration = () => {
  const navigate = useNavigate();
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

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
      navigate("/sdg-goals"); // Redirect to the SDGGoals page
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSdgNav = () => {
    navigate("/sdg-goals"); // Redirect to the SDGGoals page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50/30 font-sans flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20 pointer-events-none">
        <BackgroundIcons />
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <FaLeaf className="text-lg" />
          </div>
          <h1 className="font-bold text-xl text-green-800">SustainedAway</h1>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
            </div>
            <p className="text-gray-600 mt-4">
              Checking your verification status...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                {isEmailVerified ? (
                  <FaCheckCircle className="text-green-500 text-3xl" />
                ) : (
                  <FaEnvelope className="text-green-500 text-2xl" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Thank You for Joining Us!
              </h2>

              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {isEmailVerified
                  ? "Your email has been verified successfully. You're all set to start your sustainability journey."
                  : "A verification link has been sent to your email. Please verify your email and refresh this page to continue."}
              </p>

              {isEmailVerified && (
                <button
                  onClick={handleSdgNav}
                  className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-green-500 to-green-600 text-white shadow hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 mx-auto"
                >
                  <span>Continue</span>
                  <FaArrowRight className="text-sm" />
                </button>
              )}

              {!isEmailVerified && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">
                    Didn't receive the email?
                  </p>
                  <button
                    className="text-green-600 text-sm hover:text-green-700 font-medium"
                    onClick={() => window.location.reload()}
                  >
                    Refresh page
                  </button>
                </div>
              )}
            </div>

            <div className="bg-green-50 px-6 py-4 text-center text-sm text-gray-600">
              Start your sustainability journey with SustainedAway
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostRegistration;

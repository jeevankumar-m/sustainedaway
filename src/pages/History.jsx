import React, { useState, useEffect, useRef } from "react";
import { Container, Typography, IconButton, Button } from "@mui/material";
import { FaBars, FaStore, FaFileInvoice, FaHistory, FaRecycle, FaCamera, FaSignOutAlt, FaComments } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./Dashboard.css"; // Reuse existing styles
import Loader from "../Loader";

const History = () => {
  const [history, setHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedTips, setExpandedTips] = useState({}); // Track expanded state
  const navigate = useNavigate();
  const auth = getAuth();
  const historyContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const historyRef = collection(db, "history");
    const q = query(historyRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHistory(historyData);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    setTimeout(() => {
      if (historyContainerRef.current) {
        historyContainerRef.current.scrollTop = 0;
      }
    }, 100);
  }, [history]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleRecyclingTips = (id) => {
    setExpandedTips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-50 to-green-200 overflow-hidden" style={{ fontFamily: 'SF Pro, San Francisco, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>
      {loading && <Loader />}
      <Container className="dashboard">
        {/* Full-width Enhanced Top Bar */}
        <div className="fixed top-0 left-0 w-full z-20">
          <div className="w-full flex items-center justify-between px-8 py-2 bg-gradient-to-r from-green-500 via-green-400 to-blue-300/80 backdrop-blur-lg shadow-lg border-b-2 border-green-200/40" style={{ minHeight: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
            <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button !text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FaBars size={24} />
            </IconButton>
            <Typography variant="h6" className="font-bold tracking-tight text-white drop-shadow-lg" style={{ fontFamily: 'inherit', fontSize: '1.1rem', letterSpacing: '-0.01em', margin: 0 }}>
              Product Scan History
            </Typography>
            <IconButton className="sign-out-button !text-white" onClick={handleSignOut} style={{ background: 'none', border: 'none', cursor: 'pointer', width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaSignOutAlt size={24} />
            </IconButton>
          </div>
        </div>

        {/* Floating Side Menu */}
        <div className={`side-menu ${menuOpen ? "open" : ""} z-30 fixed left-0 top-20`}>
          <ul className="pt-6 pb-4 px-2">
            <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }} className="mb-2">
              <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
                <FaCamera /> Scanner
              </span>
            </li>
            <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }} className="mb-2">
              <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
                <FaFileInvoice /> Bill Scanner
              </span>
            </li>
            <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }} className="mb-2">
              <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
                <FaStore /> Store Ratings
              </span>
            </li>
            <li onClick={() => { setMenuOpen(false); navigate("/sustainavoice"); }} className="mb-2">
              <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
                <FaComments /> SustainaVoice
              </span>
            </li>
            <li onClick={() => { setMenuOpen(false); navigate("/history"); }} className="active mb-2">
              <span className="flex items-center gap-2 font-bold text-base text-white bg-gradient-to-r from-green-500 to-green-700 px-3 py-2 rounded-xl shadow-md">
                <FaHistory /> History
              </span>
            </li>
            <li onClick={handleSignOut} className="mt-4">
              <span className="flex items-center gap-2 font-semibold text-base text-red-700 hover:bg-red-100/60 px-3 py-2 rounded-xl transition-all">
                <FaSignOutAlt /> Sign Out
              </span>
            </li>
          </ul>
        </div>

        {/* ✅ Scrollable History Container */}
        <div ref={historyContainerRef} className="history-container" style={{ marginTop: 80 }}>
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="history-card">
                <h3 style={{ textAlign: "center" }}>{item.productName || "Unknown Product"}</h3>
                {/* Display the image if available */}
                {item.imageUrl && (
                  <div className="history-image-container">
                    <img src={item.imageUrl} alt="Scanned Product" className="history-image" />
                  </div>
                )}

                <p>🏢 <strong>Brand:</strong> {item.brand || "Not Available"}</p>
                <p>🌱 <strong>Sustainability Score:</strong> {item.sustainabilityScore ?? "N/A"}/5</p>
                <p>📦 <strong>Packaging:</strong> {item.packagingMaterial || "No details available"}</p>
                <p>🧪 <strong>Ingredients:</strong> {item.ingredientsImpact || "Not listed"}</p>
                <p>♻ <strong>Recycling Feasibility:</strong> {item.recyclingFeasibility || "Not listed"}</p>
                <p>❤️ <strong>Health Impact:</strong> {item.healthimpact || "Not listed"}</p>
                <p>📅 <strong>Scanned on:</strong> {item.dateScanned ? item.dateScanned.toDate().toLocaleString() : "Date not available"}</p>

                {/* ✅ Recycling Tips Button */}
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={() => toggleRecyclingTips(item.id)}
                  style={{ marginTop: "10px", display: "flex", alignItems: "center" }}
                >
                  <FaRecycle style={{ marginRight: "8px" }} /> Recycling Tips
                </Button>

                {/* ✅ Smooth Expand/Collapse Animation */}
                {expandedTips[item.id] && (
                  <div className="recycling-tips">
                    <p>{item.recyclingtips || "No recycling tips available for this product."}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <Typography align="center">No history found.</Typography>
          )}
        </div>
      </Container>
    </div>
  );
};

export default History;
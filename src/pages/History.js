import React, { useState, useEffect, useRef } from "react";
import { Container, Typography, IconButton, Button } from "@mui/material";
import { FaBars, FaStore, FaFileInvoice, FaHistory, FaRecycle, FaCamera, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./Dashboard.css"; // Reuse existing styles

const History = () => {
  const [history, setHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedTips, setExpandedTips] = useState({}); // Track expanded state
  const navigate = useNavigate();
  const auth = getAuth();
  const historyContainerRef = useRef(null);

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
    <Container className="dashboard">
      {/* ✅ Top Bar */}
      <div className="top-bar">
        <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          <FaBars />
        </IconButton>
        <Typography variant="h5" className="title">📜 Product Scan History</Typography>
        <IconButton className="sign-out-button" onClick={handleSignOut}>
          <FaSignOutAlt />
        </IconButton>
      </div>

      {/* ✅ Scrollable History Container */}
      <div ref={historyContainerRef} className="history-container">
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

      {/* ✅ Floating Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}> <FaCamera /> Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }}> <FaFileInvoice /> Bill Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }}> <FaStore /> Store Ratings </li>
          <li onClick={() => { setMenuOpen(false); navigate("/history"); }}> <FaHistory /> History </li>
          <li onClick={handleSignOut}> <FaSignOutAlt /> Sign Out </li>
        </ul>
      </div>
    </Container>
  );
};

export default History;
import React, { useState, useEffect, useRef } from "react";
import { Container, Typography, IconButton } from "@mui/material";
import { FaBars, FaHome, FaHistory, FaRecycle, FaMapMarkerAlt, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase"; // Firestore import
import { collection, query, where, onSnapshot } from "firebase/firestore"; // Firestore imports
import "./Dashboard.css"; // Use the same CSS for styling

const History = () => {
  const [history, setHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const historyContainerRef = useRef(null); // ✅ Reference for scrolling

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
    // ✅ Ensure scrolling happens AFTER the DOM updates
    setTimeout(() => {
      if (historyContainerRef.current) {
        historyContainerRef.current.scrollTop = 0; // Scroll to the top
      }
    }, 100); // Small delay ensures the list updates first
  }, [history]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login after sign-out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Container className="dashboard">
      {/* ✅ Top Bar */}
      <div className="top-bar">
        <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          <FaBars />
        </IconButton>
        <Typography variant="h5" className="title">📜Product Scan History</Typography>
        <IconButton className="sign-out-button" onClick={handleSignOut}>
          <FaSignOutAlt />
        </IconButton>
      </div>

      {/* ✅ Scrollable History Container */}
      <div ref={historyContainerRef} className="history-container">
        {history.length > 0 ? (
          history.map((item) => (
            <div key={item.id} className="history-card">
              <h3>{item.productName || "Unknown Product"}</h3>
              <p>🏢 <strong>Brand:</strong> {item.brand || "Not Available"}</p>
              <p>🌱 <strong>Sustainability Score:</strong> {item.sustainabilityScore ?? "N/A"}/5</p>
              <p>📦 <strong>Packaging:</strong> {item.packagingMaterial || "No details available"}</p>
              <p>🧪 <strong>Ingredients:</strong> {item.ingredientsImpact || "Not listed"}</p>
              <p>🧪 <strong>Recycling Feasibility:</strong> {item.recyclingFeasibility || "Not listed"}</p>
              <p>📅 <strong>Scanned on:</strong> 
  {item.dateScanned ? item.dateScanned.toDate().toLocaleString() : "Date not available"}
</p>
              
            </div>
          ))
        ) : (
          <Typography align="center">No history found.</Typography>
        )}
      </div>

      {/* ✅ Floating Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}> <FaHome /> Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/history"); }}> <FaHistory /> History </li>
          <li onClick={() => { setMenuOpen(false); navigate("/recycle"); }}> <FaRecycle /> Recycle Guide </li>
          <li onClick={() => { setMenuOpen(false); navigate("/ngo-locator"); }}> <FaMapMarkerAlt /> NGO Locator </li>
          <li onClick={handleSignOut}> <FaSignOutAlt /> Sign Out </li>
        </ul>
      </div>
    </Container>
  );
};

export default History;

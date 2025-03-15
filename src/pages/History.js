import React, { useState } from "react";
import { Container, Typography, IconButton } from "@mui/material";
import { FaBars, FaHome, FaRecycle, FaMapMarkerAlt, FaHistory, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "./Dashboard.css"; // Using shared styles

const History = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login page after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Container className="history-container" maxWidth={false} disableGutters>

      {/* 🔹 Top Bar with Menu Button & Sign-Out */}
      <div className="top-bar">
        <IconButton onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          <FaBars />
        </IconButton>
        <Typography variant="h5" className="title">Sustainaway 🌱</Typography>
        <IconButton className="sign-out-button" onClick={handleSignOut}>
          <FaSignOutAlt />
        </IconButton>
      </div>

      {/* 🔹 Floating Side Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => { setMenuOpen(false); navigate("/"); }}><FaHome /> Scanner</li>
          <li onClick={() => setMenuOpen(false)}><FaRecycle /> Recycle Guide</li>
          <li onClick={() => setMenuOpen(false)}><FaMapMarkerAlt /> NGO Locator</li>
          <li className="active"><FaHistory /> History</li>
          <li onClick={handleSignOut}><FaSignOutAlt /> Sign Out</li>
        </ul>
      </div>

    </Container>
  );
};

export default History;

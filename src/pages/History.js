import React from "react";
import { Container, Typography, IconButton } from "@mui/material";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();

  return (
    <Container className="history-container">
      {/* Back Button */}
      <IconButton onClick={() => navigate(-1)} className="back-button">
        <FaArrowLeft />
      </IconButton>

      <Typography variant="h4" className="title">History</Typography>

      {/* Add history content here */}
      <Typography variant="body1">Your scanned items will appear here.</Typography>
    </Container>
  );
};

export default History;

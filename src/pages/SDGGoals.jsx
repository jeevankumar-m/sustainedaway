import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader";

const SDGGoals = () => {
  const navigate = useNavigate();
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const sdgGoals = [
    {
      id: 3,
      title: "Good Health and Well-being",
      image: "https://res.cloudinary.com/dgfepyx8a/image/upload/v1749020817/REGISTRATIONDONOTDELETE/epa2saneaxckcnwi8bpq.jpg",
      description: "Ensure healthy lives and promote well-being for all at all ages.",
    },
    {
      id: 12,
      title: "Responsible Consumption and Production",
      image: "https://res.cloudinary.com/dgfepyx8a/image/upload/v1749020812/REGISTRATIONDONOTDELETE/anofqkwgwamcvjzn2i00.jpg",
      description: "Ensure sustainable consumption and production patterns.",
    },
    {
      id: 13,
      title: "Climate Action",
      image: "https://res.cloudinary.com/dgfepyx8a/image/upload/v1749020812/REGISTRATIONDONOTDELETE/ccumk6cgkvkzlysizrcz.jpg",
      description: "Take urgent action to combat climate change and its impacts.",
    },
  ];

  const handleContinue = () => {
    if (currentGoalIndex < sdgGoals.length - 1) {
      setCurrentGoalIndex(currentGoalIndex + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const currentGoal = sdgGoals[currentGoalIndex];

  return (
    <div style={styles.pageContainer}>
      {loading && <Loader />}
      <div style={styles.phoneContainer}>
        <h1 style={styles.title}>Sustainable Development Goals</h1>
        <p style={styles.subtitle}>At Sustainedaway, we tackle the following SDGs:</p>
        <div style={styles.problemStatement}>
          <h2 style={styles.problemTitle}>The Problem We Solve</h2>
          <p style={styles.problemText}>
            Consumers struggle to make sustainable choices due to lack of information. Our app helps
            by analyzing product sustainability and offering insights.
          </p>
        </div>
        <div style={styles.goalContainer}>
          <img src={currentGoal.image} alt={currentGoal.title} style={styles.goalImage} />
          <h2 style={styles.goalTitle}>{`SDG ${currentGoal.id}: ${currentGoal.title}`}</h2>
          <p style={styles.goalDescription}>{currentGoal.description}</p>
        </div>
        <button onClick={handleContinue} style={styles.continueButton}>
          {currentGoalIndex < sdgGoals.length - 1 ? "Continue" : "Go to Dashboard"}
        </button>
      </div>
    </div>
  );
};

export default SDGGoals;

const styles = {
  pageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "white",
  },
  phoneContainer: {
    width: "350px",
    height: "90vh",
    backgroundColor: "white",
    borderRadius: "30px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    overflowY: "auto",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#2E7D32",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "20px",
  },
  problemStatement: {
    backgroundColor: "#f5f5f5",
    padding: "15px",
    borderRadius: "10px",
    textAlign: "left",
    fontSize: "0.9rem",
    marginBottom: "20px",
  },
  problemTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2E7D32",
  },
  problemText: {
    fontSize: "0.9rem",
    color: "#333",
    lineHeight: "1.4",
  },
  goalContainer: {
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "15px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  goalImage: {
    width: "120px",
    height: "120px",
    borderRadius: "10px",
    marginBottom: "15px",
    objectFit: "cover",
  },
  goalTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2E7D32",
  },
  goalDescription: {
    fontSize: "0.9rem",
    color: "#555",
    lineHeight: "1.4",
  },
  continueButton: {
    marginTop: "20px",
    padding: "10px 15px",
    fontSize: "1rem",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.2s ease",
  },
};

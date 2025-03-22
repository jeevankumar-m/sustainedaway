import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SDGGoals = () => {
  const navigate = useNavigate();
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

  // List of SDG goals with their images and descriptions
  const sdgGoals = [
    {
      id: 1,
      title: "No Poverty",
      image: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2016/08/E_SDG-goals_icons-individual-rgb-01.png",
      description: "End poverty in all its forms everywhere.",
    },
    {
      id: 2,
      title: "Zero Hunger",
      image: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2016/08/E_SDG-goals_icons-individual-rgb-02.png",
      description: "End hunger, achieve food security and improved nutrition, and promote sustainable agriculture.",
    },
    {
      id: 3,
      title: "Good Health and Well-being",
      image: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2016/08/E_SDG-goals_icons-individual-rgb-03.png",
      description: "Ensure healthy lives and promote well-being for all at all ages.",
    },
    {
      id: 12,
      title: "Responsible Consumption and Production",
      image: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2016/08/E_SDG-goals_icons-individual-rgb-12.png",
      description: "Ensure sustainable consumption and production patterns.",
    },
    {
      id: 13,
      title: "Climate Action",
      image: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2016/08/E_SDG-goals_icons-individual-rgb-13.png",
      description: "Take urgent action to combat climate change and its impacts.",
    },
  ];

  const handleContinue = () => {
    if (currentGoalIndex < sdgGoals.length - 1) {
      // Move to the next goal
      setCurrentGoalIndex(currentGoalIndex + 1);
    } else {
      // Redirect to the dashboard after all goals are viewed
      navigate("/dashboard");
    }
  };

  const currentGoal = sdgGoals[currentGoalIndex];

  return (
    <div style={{ textAlign: "center", padding: "20px", backgroundColor: "white" }}>
      <h1>Sustainable Development Goals (SDGs) We Tackle</h1>
      <p>
        At Sustainedaway, we are committed to addressing the following SDGs through our platform:
      </p>

      {/* Display the current SDG goal */}
      <div style={{ margin: "20px 0", backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
        <img
          src={currentGoal.image}
          alt={`SDG ${currentGoal.id}: ${currentGoal.title}`}
          style={{ width: "150px", height: "150px", backgroundColor: "white" }}
        />
        <h2>{`SDG ${currentGoal.id}: ${currentGoal.title}`}</h2>
        <p>{currentGoal.description}</p>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {currentGoalIndex < sdgGoals.length - 1 ? "Continue" : "Go to Dashboard"}
      </button>
    </div>
  );
};

export default SDGGoals;
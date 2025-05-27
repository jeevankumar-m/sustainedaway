import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import BillScanner from "./pages/Billscanner"; 
import StoreRatings from "./pages/StoreRatings";
import SDGGoals from "./pages/SDGGoals";
import Postregistration from "./pages/Postregistration";
import SustainaVoice from "./pages/SustainaVoice"; // ✅ Import the new component
import Landing from "./pages/Landing";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
        <Route path="/bill-scanner" element={user ? <BillScanner /> : <Navigate to="/login" />} />
        <Route path="/store-ratings" element={user ? <StoreRatings /> : <Navigate to="/login" />} />
        <Route path="/post-registration" element={user ? <Postregistration /> : <Navigate to="/login" />} />
        <Route path="/sdg-goals" element={user ? <SDGGoals /> : <Navigate to="/login" />} />
        <Route path="/sustainavoice" element={user ? <SustainaVoice /> : <Navigate to="/login" />} />
        <Route path="/landing" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;

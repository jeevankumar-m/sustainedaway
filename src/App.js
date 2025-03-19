import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import BillScanner from "./pages/Billscanner"; 
import StoreRatings from "./pages/StoreRatings";
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
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/history" element={user ? <History /> : <Navigate to="/" />} /> {/* ✅ Protect History */}
        <Route path="/bill-scanner" element={user ? <BillScanner /> : <Navigate to="/" />} /> {/* ✅ Add Bill Scanner */}
        <Route path="/store-ratings" element={user ? <StoreRatings /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;


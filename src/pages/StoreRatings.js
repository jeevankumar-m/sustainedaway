import React, { useEffect, useState } from "react";
import { FaBars, FaStore, FaHistory, FaFileInvoice, FaCamera, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import "./Dashboard.css"; // ✅ Reused Dashboard styles

const StoreRatings = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [rating, setRating] = useState(3);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (!navigator.geolocation) {
      setMessage({ text: "Geolocation is not supported by your browser.", type: "error" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (!map) {
          const newMap = L.map("map").setView([latitude, longitude], 15);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(newMap);
          setMap(newMap);

          L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              iconSize: [30, 30],
              iconAnchor: [15, 30],
            }),
          })
            .addTo(newMap)
            .bindPopup("<b>You are here</b>")
            .openPopup();
        }
      },
      () => setMessage({ text: "Location access denied!", type: "error" })
    );
  }, []);

  useEffect(() => {
    if (map) {
      fetchStoreRatings();
    }
  }, [map]);

  // 🏬 Fetch store ratings & group nearby locations
  const fetchStoreRatings = async () => {
    const querySnapshot = await getDocs(collection(db, "storeRatings"));
    let ratingsData = [];

    querySnapshot.forEach((doc) => {
      ratingsData.push(doc.data());
    });

    let storeGroups = {};

    // Function to check if two locations are "near" each other
    const isNearby = (lat1, lng1, lat2, lng2) => {
      const threshold = 0.0005; // ~50 meters rough distance
      return Math.abs(lat1 - lat2) < threshold && Math.abs(lng1 - lng2) < threshold;
    };

    // Group stores by rough location
    ratingsData.forEach(({ storeName, lat, lng, rating }) => {
      let found = false;
      for (let key in storeGroups) {
        let group = storeGroups[key];

        if (isNearby(group.lat, group.lng, lat, lng)) {
          group.ratings.push(rating);
          found = true;
          break;
        }
      }

      if (!found) {
        storeGroups[`${storeName}-${lat}-${lng}`] = {
          storeName,
          lat,
          lng,
          ratings: [rating],
        };
      }
    });

    // Calculate averages & add markers
    Object.values(storeGroups).forEach(({ storeName, lat, lng, ratings }) => {
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      const markerColor = avgRating >= 4 ? "green" : "red";
      const markerIcon = L.icon({
        iconUrl:
          markerColor === "green"
            ? "https://leafletjs.com/examples/custom-icons/leaf-green.png"
            : "https://leafletjs.com/examples/custom-icons/leaf-red.png",
        iconSize: [38, 38],
      });

      L.marker([lat, lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`<b>${storeName}</b><br>Average Rating: ${avgRating.toFixed(1)}⭐`);
    });
  };

  // ⭐ Submit a new rating
  const handleRatingSubmit = async () => {
    if (!userLocation) return setMessage({ text: "Location not detected!", type: "error" });
    if (!storeName.trim()) return setMessage({ text: "Please enter a store name!", type: "error" });

    await addDoc(collection(db, "storeRatings"), {
      storeName,
      lat: userLocation.lat,
      lng: userLocation.lng,
      rating,
    });

    setMessage({ text: "Rating submitted successfully!", type: "success" });
    setStoreName("");
    fetchStoreRatings();
  };

  return (
    <div className="dashboard">
      {/* 🔹 Top Bar */}
      <div className="top-bar">
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
          <FaBars />
        </button>
        <h2 className="title">⭐ Store Ratings</h2>
        <button className="sign-out-button" onClick={() => signOut(auth).then(() => navigate("/login"))}>
          <FaSignOutAlt />
        </button>
      </div>

      {/* 🔹 Side Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}> <FaCamera /> Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }}> <FaFileInvoice /> Bill Scanner </li>
          <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }}> <FaStore /> Store Ratings </li>
          <li onClick={() => { setMenuOpen(false); navigate("/history"); }}> <FaHistory /> History </li>  {/* ✅ Added */}
          <li className="logout" onClick={() => signOut(auth).then(() => navigate("/login"))}>
            <FaSignOutAlt /> Sign Out
          </li>
        </ul>
      </div>

      {/* 🔹 Map & Rating Box */}
      <div className="content">
        <div id="map" className="map-container"></div>

        <div className="rating-box">
          <h3>Rate This Location</h3>
          {message.text && (
            <p className={message.type === "error" ? "error-message" : "success-message"}>
              {message.text}
            </p>
          )}
          <input
            type="text"
            placeholder="Enter store name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
            <option value="1">⭐ 1</option>
            <option value="2">⭐⭐ 2</option>
            <option value="3">⭐⭐⭐ 3</option>
            <option value="4">⭐⭐⭐⭐ 4</option>
            <option value="5">⭐⭐⭐⭐⭐ 5</option>
          </select>
          <button onClick={handleRatingSubmit}>Submit Rating</button>
        </div>
      </div>
    </div>
  );
};

export default StoreRatings;

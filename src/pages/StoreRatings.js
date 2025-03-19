import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import "./StoreRatings.css";

const StoreRatings = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [rating, setRating] = useState(3);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
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
      () => alert("Location access denied!")
    );
  }, []);

  useEffect(() => {
    if (map) {
      fetchStoreRatings();
    }
  }, [map]);

  // 🏬 Fetch all store ratings & group nearby locations
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
      const avgRating =
        ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

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
    if (!userLocation) return alert("Location not detected!");
    if (!storeName.trim()) return alert("Please enter a store name!");

    await addDoc(collection(db, "storeRatings"), {
      storeName,
      lat: userLocation.lat,
      lng: userLocation.lng,
      rating,
    });

    alert("Rating submitted!");
    setStoreName("");
    fetchStoreRatings();
  };

  return (
    <div className="store-container">
      <div id="map" className="map-container"></div>

      {/* ⭐ Rating UI */}
      <div className="rating-box">
        <h3>Rate This Location</h3>
        <input
          type="text"
          placeholder="Enter store name"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
        <select
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value))}
        >
          <option value="1">⭐ 1</option>
          <option value="2">⭐⭐ 2</option>
          <option value="3">⭐⭐⭐ 3</option>
          <option value="4">⭐⭐⭐⭐ 4</option>
          <option value="5">⭐⭐⭐⭐⭐ 5</option>
        </select>
        <button onClick={handleRatingSubmit}>Submit Rating</button>
      </div>
    </div>
  );
};

export default StoreRatings;

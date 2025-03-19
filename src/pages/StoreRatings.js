import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

const StoreRatings = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [rating, setRating] = useState(3);
  const [selectedStore, setSelectedStore] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          if (!map) {
            const newMap = L.map("map").setView([latitude, longitude], 13);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors",
            }).addTo(newMap);
            setMap(newMap);

            // 📍 BLUE PIN for user location
            L.marker([latitude, longitude], {
              icon: L.icon({
                iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Blue pin
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
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    if (map) {
      fetchStoreRatings();
    }
  }, [map]);

  const fetchStoreRatings = async () => {
    const querySnapshot = await getDocs(collection(db, "storeRatings"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (userLocation) {
        const distance = getDistance(userLocation.lat, userLocation.lng, data.lat, data.lng);
        if (distance <= 25) {
          const markerColor = data.rating >= 4 ? "green" : "red";
          const markerIcon = L.icon({
            iconUrl: markerColor === "green"
              ? "https://leafletjs.com/examples/custom-icons/leaf-green.png"
              : "https://leafletjs.com/examples/custom-icons/leaf-red.png",
            iconSize: [38, 38],
          });

          // 📌 Add Store Markers (Green or Red)
          L.marker([data.lat, data.lng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(`<b>${data.storeName}</b><br>Rating: ${data.rating}⭐`);
        }
      }
    });
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 📍 Search for a location and add a red marker
  const handleSearchLocation = () => {
    if (!selectedStore) return alert("Enter a location name!");
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${selectedStore}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length === 0) {
          alert("Location not found!");
          return;
        }
        const { lat, lon } = data[0];
        setSearchLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });

        if (map) {
          // 📍 Remove old search markers
          map.eachLayer((layer) => {
            if (layer.options && layer.options.pane === "markerPane") {
              map.removeLayer(layer);
            }
          });

          // 📍 Add new search marker
          L.marker([lat, lon], {
            icon: L.icon({
              iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // Red pin for search
              iconSize: [30, 30],
              iconAnchor: [15, 30],
            }),
          })
            .addTo(map)
            .bindPopup(`<b>${selectedStore}</b>`)
            .openPopup();

          map.setView([lat, lon], 14);
        }
      })
      .catch(() => alert("Error fetching location!"));
  };

  // ⭐ Submit a rating for the searched location
  const handleRatingSubmit = async () => {
    if (!searchLocation) return alert("Search a location first!");
    await addDoc(collection(db, "storeRatings"), {
      storeName: selectedStore,
      lat: searchLocation.lat,
      lng: searchLocation.lng,
      rating,
    });
    alert("Rating submitted!");
    fetchStoreRatings(); // Refresh markers
  };

  return (
    <div>
      <div id="map" style={{ width: "100%", height: "500px" }}></div>
      <br />

      {/* 🔍 Search Box */}
      <h3>Search for a Location</h3>
      <input
        type="text"
        placeholder="Enter store name or location"
        value={selectedStore}
        onChange={(e) => setSelectedStore(e.target.value)}
      />
      <button onClick={handleSearchLocation}>Search</button>

      {/* ⭐ Rating Box */}
      <h3>Rate this Location</h3>
      <input
        type="number"
        min="1"
        max="5"
        value={rating}
        onChange={(e) => setRating(parseInt(e.target.value))}
      />
      <button onClick={handleRatingSubmit}>Submit Rating</button>
    </div>
  );
};

export default StoreRatings;

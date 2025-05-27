import React, { useEffect, useState, useRef } from "react";
import { FaBars, FaStore, FaHistory, FaFileInvoice, FaCamera, FaSignOutAlt, FaComments, FaDirections, FaStar, FaLeaf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import "./Dashboard.css";
import Loader from "../Loader";
import * as turf from "@turf/turf";
import { Button, Card, CardContent, Typography, Fab, TextField } from '@mui/material';
import { moderateContent, sanitizeText } from '../utils/contentModeration';

// Replace with your Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoiamVldmFua3VtYXIwNiIsImEiOiJjbWE1NXoxZnAwZ3p3MndzZGd1MDV5enVpIn0.td1ijvmrNUL0WFj61KS0lg";

const StoreRatings = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [rating, setRating] = useState(3);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [directions, setDirections] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [transportMode, setTransportMode] = useState('walking');
  const [isMoving, setIsMoving] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const moveMarker = useRef(null);
  const animationFrame = useRef(null);
  const [showTracker, setShowTracker] = useState(false);
  const [nearbyRoutes, setNearbyRoutes] = useState([]);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [directionsShown, setDirectionsShown] = useState(false);

  // Initialize map
  useEffect(() => {
    console.log("Initializing map...");
    console.log("Map container ref:", mapContainer.current);

    if (!mapContainer.current) {
      console.error("Map container ref is null");
      return;
    }

    if (!navigator.geolocation) {
      setMessage({ text: "Geolocation is not supported by your browser.", type: "error" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Got user position:", position);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        try {
          if (!map.current) {
            console.log("Creating new map instance...");
            map.current = new mapboxgl.Map({
              container: mapContainer.current,
              style: "mapbox://styles/mapbox/streets-v12",
              center: [longitude, latitude],
              zoom: 13,
              attributionControl: false
            });

            console.log("Map instance created");

            // Add attribution control
            map.current.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

            // Add user location marker
            new mapboxgl.Marker({ color: "#4CAF50" })
              .setLngLat([longitude, latitude])
              .setPopup(new mapboxgl.Popup().setHTML("<b>You are here</b>"))
              .addTo(map.current);

            // Wait for map to load before adding layers
            map.current.on('load', () => {
              console.log("Map loaded successfully");
              fetchStoreRatings();
            });

            map.current.on('error', (e) => {
              console.error("Mapbox error:", e);
              setMapError(e.error);
            });

            // Add click event to map
            map.current.on("click", (e) => {
              const features = map.current.queryRenderedFeatures(e.point, {
                layers: ["unclustered-point"]
              });
              
              console.log("Clicked features:", features);
              
              if (features.length > 0) {
                const feature = features[0];
                console.log("Selected feature:", feature);
                
                // Extract coordinates from the feature
                const coordinates = feature.geometry.coordinates;
                console.log("Feature coordinates:", coordinates);
                
                // Create store object with coordinates
                const store = {
                  ...feature.properties,
                  lng: coordinates[0],
                  lat: coordinates[1]
                };
                
                console.log("Store data with coordinates:", store);
                setSelectedStore(store);
                
                // Get directions to the store
                getDirections(store);

                // Create popup with enhanced content
                new mapboxgl.Popup()
                  .setLngLat(coordinates)
                  .setHTML(createStorePopup(feature))
                  .addTo(map.current);
              } else {
                setSelectedStore(null);
                setDirections(null);
                // Remove route layer if it exists
                if (map.current.getSource("route")) {
                  map.current.removeLayer("route");
                  map.current.removeSource("route");
                }
              }
            });

            // Add hover effects
            map.current.on("mouseenter", "unclustered-point", () => {
              map.current.getCanvas().style.cursor = "pointer";
            });

            map.current.on("mouseleave", "unclustered-point", () => {
              map.current.getCanvas().style.cursor = "";
            });

            // Add popup on hover
            map.current.on("mouseenter", "unclustered-point", (e) => {
              const coordinates = e.features[0].geometry.coordinates.slice();
              const store = e.features[0].properties;

              // Ensure that if the map is zoomed out such that multiple
              // copies of the feature are visible, the popup appears
              // over the copy being pointed to.
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }

              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(createStorePopup(e.features[0]))
                .addTo(map.current);
            });

            // Change the cursor to a pointer when the mouse is over the stores layer.
            map.current.on("mouseenter", "unclustered-point", () => {
              map.current.getCanvas().style.cursor = "pointer";
            });

            // Change it back to a pointer when it leaves.
            map.current.on("mouseleave", "unclustered-point", () => {
              map.current.getCanvas().style.cursor = "";
            });
          }
        } catch (error) {
          console.error("Error initializing map:", error);
          setMapError(error.message);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setMessage({ text: "Location access denied!", type: "error" });
      }
    );

    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
      }
    };
  }, []);

  // Fetch and display store ratings
  useEffect(() => {
    if (map.current) {
      fetchStoreRatings();
    }
  }, [map.current]);

  const fetchStoreRatings = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "storeRatings"));
    let ratingsData = [];

    querySnapshot.forEach((doc) => {
      ratingsData.push({ id: doc.id, ...doc.data() });
    });

    // Group stores by location and calculate averages
    let storeGroups = {};
    ratingsData.forEach(({ storeName, lat, lng, rating, comment, timestamp }) => {
      const key = `${storeName}-${lat}-${lng}`;
      if (!storeGroups[key]) {
        storeGroups[key] = {
          storeName,
          lat,
          lng,
          ratings: [rating],
          comments: comment ? [comment] : [],
          timestamps: [timestamp],
          coordinates: [lng, lat]
        };
      } else {
        storeGroups[key].ratings.push(rating);
        if (comment) storeGroups[key].comments.push(comment);
        storeGroups[key].timestamps.push(timestamp);
      }
    });

    // Calculate averages and prepare GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: Object.values(storeGroups).map(({ storeName, coordinates, ratings, comments, timestamps }) => {
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        // Get the most recent comment
        const latestComment = comments.length > 0 
          ? comments[timestamps.indexOf(Math.max(...timestamps))]
          : null;
        
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates
          },
          properties: {
            storeName,
            avgRating: parseFloat(avgRating.toFixed(1)),
            ratingCount: ratings.length,
            latestComment,
            totalRatings: ratings.length,
            ratingDistribution: {
              1: ratings.filter(r => r === 1).length,
              2: ratings.filter(r => r === 2).length,
              3: ratings.filter(r => r === 3).length,
              4: ratings.filter(r => r === 4).length,
              5: ratings.filter(r => r === 5).length
            }
          }
        };
      })
    };

    // Add stores layer
    if (map.current.getSource("stores")) {
      map.current.getSource("stores").setData(geojson);
    } else {
      map.current.addSource("stores", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add clusters
      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "stores",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            10, "#f1f075",
            30, "#f28cb1"
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10, 30,
            30, 40
          ]
        }
      });

      // Add cluster count
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "stores",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12
        }
      });

      // Add store markers with color based on average rating
      map.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "stores",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "step",
            ["get", "avgRating"],
            "#ff4444", // 1-2 stars
            3, "#ffbb33", // 3 stars
            4, "#00C851" // 4-5 stars
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "ratingCount"],
            1, 6,
            10, 8,
            50, 10
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff"
        }
      });
    }
    setLoading(false);
  };

  const startMovement = (route) => {
    if (moveMarker.current) {
      moveMarker.current.remove();
    }

    // Create a new marker for movement
    moveMarker.current = new mapboxgl.Marker({
      color: "#FF0000",
      rotationAlignment: "map"
    }).addTo(map.current);

    const coordinates = route.geometry.coordinates;
    let currentIndex = 0;
    setIsMoving(true);

    const animate = () => {
      if (currentIndex < coordinates.length - 1) {
        const currentCoord = coordinates[currentIndex];
        const nextCoord = coordinates[currentIndex + 1];
        
        // Calculate bearing for marker rotation
        const bearing = turf.bearing(
          turf.point(currentCoord),
          turf.point(nextCoord)
        );

        moveMarker.current
          .setLngLat(currentCoord)
          .setRotation(bearing);

        setCurrentPosition(currentCoord);
        currentIndex++;
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setIsMoving(false);
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      }
    };

    animate();
  };

  const getDirections = async (destination) => {
    if (!userLocation) {
      setMessage({ text: "Please allow location access to get directions", type: "error" });
      return;
    }

    try {
      // Format coordinates for the API
      const origin = `${userLocation.lng.toFixed(6)},${userLocation.lat.toFixed(6)}`;
      const dest = `${destination.lng.toFixed(6)},${destination.lat.toFixed(6)}`;
      
      // Get route from Mapbox for display
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${origin};${dest}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );

      if (!response.ok) {
        throw new Error("Failed to get route");
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distance = route.distance / 1000; // Convert to km
        const duration = Math.round(route.duration / 60); // Convert to minutes

        // Determine suggested transport mode based on distance
        let suggestedMode;
        let suggestionReason;
        
        if (distance <= 1) {
          suggestedMode = 'walking';
          suggestionReason = 'This location is within walking distance (less than 1 km). Walking is the most sustainable option for short distances. Taking you to the MAP...';
        } else if (distance <= 5) {
          suggestedMode = 'bicycling';
          suggestionReason = 'This location is perfect for cycling (1-5 km). Cycling is a great sustainable option for medium distances. Taking you to the MAP...';
        } else {
          suggestedMode = 'transit';
          suggestionReason = 'This location is a bit far. Consider using public transportation to reduce your carbon footprint. Taking you to the MAP...';
        }

        // Display route on map
        if (map.current.getSource("route")) {
          map.current.removeLayer("route");
          map.current.removeSource("route");
        }

        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: route.geometry
          }
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#4CAF50",
            "line-width": 4,
            "line-opacity": 0.75
          }
        });

        // Update store details with route information and suggestion
        setSelectedStore(prev => ({
          ...prev,
          distance: `${distance.toFixed(1)} km`,
          duration: `${duration} min`,
          suggestedMode,
          suggestionReason
        }));

        // Fit map to route bounds
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(
          { lng: userLocation.lng, lat: userLocation.lat },
          { lng: destination.lng, lat: destination.lat }
        ));

        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });

      } else {
        setMessage({ text: "No route found", type: "error" });
      }
    } catch (error) {
      console.error("Error getting directions:", error);
      setMessage({ text: "Failed to get directions", type: "error" });
    }
  };

  // Add cleanup for animation frame
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (moveMarker.current) {
        moveMarker.current.remove();
      }
    };
  }, []);

  const handleRatingSubmit = async () => {
    if (!userLocation) return setMessage({ text: "Location not detected!", type: "error" });
    
    // Sanitize and moderate store name
    const sanitizedStoreName = sanitizeText(storeName);
    const storeNameModeration = moderateContent(sanitizedStoreName);
    
    if (!storeNameModeration.isClean) {
      setMessage({ text: storeNameModeration.reason, type: "error" });
      return;
    }

    // Sanitize and moderate comment if provided
    const sanitizedComment = sanitizeText(comment);
    if (sanitizedComment) {
      const commentModeration = moderateContent(sanitizedComment);
      if (!commentModeration.isClean) {
        setCommentError(commentModeration.reason);
        return;
      }
    }

    try {
      await addDoc(collection(db, "storeRatings"), {
        storeName: sanitizedStoreName,
        comment: sanitizedComment,
        lat: userLocation.lat,
        lng: userLocation.lng,
        rating,
        timestamp: new Date()
      });

      setMessage({ text: "Rating submitted successfully!", type: "success" });
      setStoreName("");
      setComment("");
      setCommentError("");
      fetchStoreRatings();
    } catch (error) {
      setMessage({ text: "Failed to submit rating. Please try again.", type: "error" });
    }
  };

  // Helper to get distance between two points (Haversine formula)
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      0.5 - Math.cos(dLat)/2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      (1 - Math.cos(dLon))/2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  // Tracker: Show green lines to sustainable stores (rating >= 3) within 4km
  const handleShowTracker = async () => {
    if (!userLocation) return;
    setShowTracker(!showTracker);
    setNearbyRoutes([]);
    // Remove previous tracker routes if toggling off
    if (showTracker && map.current.getSource('tracker-routes')) {
      map.current.removeLayer('tracker-routes');
      map.current.removeSource('tracker-routes');
      return;
    }
    // Get all stores from the map source
    const storesSource = map.current.getSource('stores');
    if (!storesSource) return;
    const storesData = storesSource._data.features;
    const nearby = storesData.filter(f => {
      const [lng, lat] = f.geometry.coordinates;
      const avgRating = f.properties.avgRating;
      return getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, lat, lng) <= 4 && avgRating >= 3;
    });
    // For each nearby store, get route and draw
    const routes = [];
    for (const store of nearby) {
      const origin = `${userLocation.lng.toFixed(6)},${userLocation.lat.toFixed(6)}`;
      const dest = `${store.geometry.coordinates[0].toFixed(6)},${store.geometry.coordinates[1].toFixed(6)}`;
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${origin};${dest}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          routes.push({
            id: store.properties.storeName + dest,
            geometry: data.routes[0].geometry,
            storeName: store.properties.storeName,
            coordinates: store.geometry.coordinates
          });
        }
      }
    }
    // Remove previous tracker routes
    if (map.current.getSource('tracker-routes')) {
      map.current.removeLayer('tracker-routes');
      map.current.removeSource('tracker-routes');
    }
    // Add all routes as a MultiLineString
    if (routes.length > 0) {
      map.current.addSource('tracker-routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routes.map(r => ({
            type: 'Feature',
            geometry: r.geometry,
            properties: { storeName: r.storeName }
          }))
        }
      });
      map.current.addLayer({
        id: 'tracker-routes',
        type: 'line',
        source: 'tracker-routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#43a047', // Green
          'line-width': 3,
          'line-opacity': 0.7,
          'line-dasharray': [2, 2]
        }
      });
    }
    setNearbyRoutes(routes);
  };

  // Update the popup content to show more rating details
  const createStorePopup = (store) => {
    return `
      <div class="store-popup">
        <h3>${store.properties.storeName}</h3>
        <div class="rating-display">
          <span class="stars">${"⭐".repeat(Math.round(store.properties.avgRating))}</span>
          <span>${store.properties.avgRating.toFixed(1)}</span>
          <span class="rating-count">(${store.properties.totalRatings} ratings)</span>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    setDirectionsShown(false);
  }, [selectedStore]);

  const handleDirectionsClick = () => {
    if (!directionsShown) {
      getDirections(selectedStore);
      setDirectionsShown(true);
      setTimeout(() => {
        if (userLocation && selectedStore) {
          const origin = `${userLocation.lat},${userLocation.lng}`;
          const destination = `${selectedStore.lat},${selectedStore.lng}`;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
          window.open(url, '_blank');
        }
      }, 3000);
    } else {
      if (userLocation && selectedStore) {
        const origin = `${userLocation.lat},${userLocation.lng}`;
        const destination = `${selectedStore.lat},${selectedStore.lng}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
        window.open(url, '_blank');
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-50 to-green-200 overflow-hidden" style={{ fontFamily: 'SF Pro, San Francisco, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>
      {loading && <Loader />}
      {mapError && (
        <div className="error-message">
          Map Error: {mapError}
        </div>
      )}
      {/* Full-width Enhanced Top Bar */}
      <div className="fixed top-0 left-0 w-full z-20">
        <div className="w-full flex items-center justify-between px-8 py-2 bg-gradient-to-r from-green-500 via-green-400 to-blue-300/80 backdrop-blur-lg shadow-lg border-b-2 border-green-200/40" style={{ minHeight: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <button className="menu-button !text-white" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <FaBars size={24} />
          </button>
          <h2 className="font-semibold tracking-tight text-white drop-shadow-lg" style={{ fontFamily: 'inherit', fontSize: '1.1rem', letterSpacing: '-0.01em', margin: 0 }}>
            Store Ratings
          </h2>
          <button className="sign-out-button !text-white" onClick={() => signOut(auth).then(() => navigate("/login"))} style={{ background: 'none', border: 'none', cursor: 'pointer', width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaSignOutAlt size={24} />
          </button>
        </div>
      </div>

      {/* Floating Side Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""} z-30 fixed left-0 top-20`}>
        <ul className="pt-6 pb-4 px-2">
          <li onClick={() => { setMenuOpen(false); navigate("/dashboard"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaCamera /> Scanner
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/bill-scanner"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaFileInvoice /> Bill Scanner
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/store-ratings"); }} className="active mb-2">
            <span className="flex items-center gap-2 font-bold text-base text-white bg-gradient-to-r from-green-500 to-green-700 px-3 py-2 rounded-xl shadow-md">
              <FaStore /> Store Ratings
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/sustainavoice"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaComments /> SustainaVoice
            </span>
          </li>
          <li onClick={() => { setMenuOpen(false); navigate("/history"); }} className="mb-2">
            <span className="flex items-center gap-2 font-semibold text-base text-green-800 hover:bg-green-100/60 px-3 py-2 rounded-xl transition-all">
              <FaHistory /> History
            </span>
          </li>
          <li onClick={() => signOut(auth).then(() => navigate("/login"))} className="mt-4">
            <span className="flex items-center gap-2 font-semibold text-base text-red-700 hover:bg-red-100/60 px-3 py-2 rounded-xl transition-all">
              <FaSignOutAlt /> Sign Out
            </span>
          </li>
        </ul>
      </div>

      {/* Map & Rating Box */}
      <div className="content w-full flex flex-col items-center mt-20 px-2 sm:px-4 overflow-y-auto" style={{ marginTop: 80, maxHeight: 'calc(100vh - 100px)' }}>
        {/* Responsive map container */}
        <div
          ref={mapContainer}
          className="map-container"
          style={{
            width: '100%',
            maxWidth: 420,
            minWidth: 250,
            minHeight: 200,
            height: 340,
            maxWidth: '95vw', // Responsive for mobile
            borderRadius: 14,
            margin: '18px 0',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        />
        {/* Floating round tracker button */}
        <Fab
          color={showTracker ? 'success' : 'default'}
          size="medium"
          aria-label="Sustainable Stores Tracker"
          onClick={handleShowTracker}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 20,
            zIndex: 10,
            boxShadow: '0 2px 8px #0002',
            background: showTracker ? '#43a047' : 'white',
            color: showTracker ? 'white' : '#43a047',
            transition: 'all 0.2s',
          }}
        >
          <FaLeaf style={{ fontSize: 22 }} />
        </Fab>
        {/* Card for selected store info - responsive and always visible */}
        {selectedStore && (
          <Card 
            className="w-full max-w-[90vw] sm:max-w-sm md:max-w-md mb-4 rounded-xl shadow-md z-20 relative"
            style={{
              margin: '16px auto',
              borderRadius: 10,
              boxShadow: '0 1px 6px #0001',
              padding: 0,
              boxSizing: 'border-box',
              minHeight: 340,
              height: 420,
            }}
          >
            <CardContent style={{ padding: 12 }}>
              <Typography variant="subtitle1" style={{ fontWeight: 700, marginBottom: 4, fontSize: 16 }}>{selectedStore.storeName}</Typography>
              <Typography variant="body2" style={{ marginBottom: 4, fontSize: 13 }}>
                <FaStar className="star-icon" style={{ fontSize: 13, marginRight: 2 }} /> {selectedStore.avgRating?.toFixed(1)} ({selectedStore.ratingCount} ratings)
              </Typography>
              {selectedStore.comment && (
                <Typography 
                  variant="body2" 
                  style={{ 
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#666'
                  }}
                >
                  "{selectedStore.comment}"
                </Typography>
              )}
              {selectedStore.distance && selectedStore.duration && (
                <div className="route-info flex flex-col gap-1 text-xs sm:text-sm">
                  <div className="route-detail flex flex-row justify-between">
                    <span className="route-label font-semibold">Distance:</span>
                    <span className="route-value">{selectedStore.distance}</span>
                  </div>
                  <div className="route-detail flex flex-row justify-between">
                    <span className="route-label font-semibold">Walking Time:</span>
                    <span className="route-value">{selectedStore.duration}</span>
                  </div>
                  {selectedStore.suggestedMode && (
                    <div className="suggestion-box w-full mt-2 p-3 rounded-xl bg-green-50 text-xs sm:text-base flex flex-col items-start sm:items-center" style={{ minWidth: 0, wordBreak: 'break-word' }}>
                      <h4 className="font-bold text-green-700 flex items-center gap-1 text-base mb-1 w-full text-left sm:text-center" style={{ fontSize: 15, margin: 0 }}>
                        🌱 Sustainable Travel Suggestion
                      </h4>
                      <p className="mt-1 mb-0 text-gray-700 w-full text-left sm:text-center" style={{ fontSize: 14 }}>{selectedStore.suggestionReason}</p>
                      <div className="mode-icon text-2xl mt-2 text-center w-full">
                        {selectedStore.suggestedMode === 'walking' && '🚶'}
                        {selectedStore.suggestedMode === 'bicycling' && '🚲'}
                        {selectedStore.suggestedMode === 'transit' && '🚌'}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button
                variant="outlined"
                color="primary"
                size="small"
                className="w-full mt-2 rounded-lg text-xs sm:text-sm block"
                style={{ borderRadius: 7, fontSize: 13, padding: '4px 10px', boxSizing: 'border-box', overflow: 'visible', minWidth: 0, maxWidth: '100%' }}
                onClick={handleDirectionsClick}
                startIcon={<FaDirections style={{ fontSize: 14 }} />}
              >
                Get Directions
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Rating Form (kept as before, but compact and responsive) */}
        <div className="rating-box w-full max-w-[90vw] sm:max-w-sm md:max-w-md p-3 rounded-xl bg-white shadow mb-4">
          <h3 className="text-base font-semibold mb-2">Rate This Location</h3>
          {message.text && (
            <p className={message.type === "error" ? "error-message" : "success-message"} style={{ fontSize: 12, marginBottom: 8 }}>
              {message.text}
            </p>
          )}
          <input
            type="text"
            placeholder="Enter store name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full p-2 mb-2 rounded border border-gray-300 text-sm"
            style={{ fontSize: 13 }}
          />
          <TextField
            multiline
            rows={3}
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setCommentError("");
            }}
            error={!!commentError}
            helperText={commentError}
            className="w-full mb-2"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '13px',
                borderRadius: '8px',
              },
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 7 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                onClick={() => setRating(star)}
                style={{
                  cursor: 'pointer',
                  color: star <= rating ? '#FFD700' : '#E0E0E0',
                  fontSize: 22,
                  marginRight: 2
                }}
                className="transition-colors duration-150"
              />
            ))}
          </div>
          <Button
            variant="contained"
            color="success"
            size="small"
            className="w-full mt-1 rounded-lg text-xs sm:text-sm"
            style={{ borderRadius: 7, fontSize: 13, padding: '6px 0', fontWeight: 600 }}
            onClick={handleRatingSubmit}
          >
            Submit Rating
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreRatings;

// Add these styles to your CSS
const styles = `
.transport-mode {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.mode-button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.mode-button:hover {
  background: #f0f0f0;
}

.mode-button.active:hover {
  background: #45a049;
}

.suggestion-box {
  background-color: #f0f7f0;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  border: 1px solid #4CAF50;
}

.suggestion-box h4 {
  color: #2E7D32;
  margin: 0 0 10px 0;
}

.suggestion-box p {
  margin: 0;
  color: #333;
  font-size: 0.9em;
}

.mode-icon {
  font-size: 24px;
  margin-top: 10px;
  text-align: center;
}

.route-info {
  margin-top: 15px;
}

.route-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.route-label {
  color: #666;
}

.route-value {
  font-weight: 500;
}

.store-popup {
  padding: 15px;
  min-width: 250px;
}

.rating-distribution {
  margin-top: 10px;
  font-size: 12px;
}

.rating-bar {
  display: flex;
  align-items: center;
  margin: 3px 0;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  margin: 0 8px;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #4CAF50;
  border-radius: 4px;
}

.latest-comment {
  margin-top: 10px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-style: italic;
  font-size: 12px;
}
`;
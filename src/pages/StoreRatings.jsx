import React, { useEffect, useState, useRef } from "react";
import {
  FaBars,
  FaStore,
  FaHistory,
  FaFileInvoice,
  FaCamera,
  FaSignOutAlt,
  FaComments,
  FaDirections,
  FaStar,
  FaLeaf,
  FaTimes,
  FaInfoCircle,
  FaWalking,
  FaBicycle,
  FaBus,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { db } from "../firebase";
import { collection, getDocs, addDoc, query, where, updateDoc, doc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import * as turf from "@turf/turf";
import { moderateContent, sanitizeText } from "../utils/contentModeration";
import BackgroundIcons from "../BackgroundIcons";

// Replace with your Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1IjoiamVldmFua3VtYXIwNiIsImEiOiJjbWE1NXoxZnAwZ3p3MndzZGd1MDV5enVpIn0.td1ijvmrNUL0WFj61KS0lg";

// Spinner component for loading states
const Spinner = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

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
  const [transportMode, setTransportMode] = useState("walking");
  const [isMoving, setIsMoving] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const moveMarker = useRef(null);
  const animationFrame = useRef(null);
  const [showTracker, setShowTracker] = useState(false);
  const [nearbyRoutes, setNearbyRoutes] = useState([]);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [directionsShown, setDirectionsShown] = useState(false);
  const [ratingFormVisible, setRatingFormVisible] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [topStores, setTopStores] = useState([]);
  const [storeComments, setStoreComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  // Add this function near the top of the component, after the imports
  const generateAnonymousName = () => {
    const adjectives = [
      "Eco", "Green", "Sustainable", "Earth", "Nature", "Forest", "Ocean", 
      "Mountain", "River", "Sun", "Wind", "Rain", "Leaf", "Tree", "Garden"
    ];
    const nouns = [
      "Friend", "Lover", "Warrior", "Guardian", "Explorer", "Traveler", 
      "Dreamer", "Thinker", "Creator", "Builder", "Helper", "Guide", 
      "Student", "Teacher", "Artist"
    ];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective}${randomNoun}`;
  };

  // Initialize map
  useEffect(() => {
    console.log("Initializing map...");

    if (!mapContainer.current) {
      console.error("Map container ref is null");
      return;
    }

    if (!navigator.geolocation) {
      setMessage({
        text: "Geolocation is not supported by your browser.",
        type: "error",
      });
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
              attributionControl: false,
            });

            console.log("Map instance created");

            // Handle missing images
            map.current.on('styleimagemissing', (e) => {
              console.log('Missing image:', e.id);
            });

            // Add attribution control
            map.current.addControl(
              new mapboxgl.AttributionControl(),
              "bottom-right"
            );

            // Add navigation controls
            map.current.addControl(
              new mapboxgl.NavigationControl(),
              "top-right"
            );

            // Add user location marker
            new mapboxgl.Marker({ color: "#4CAF50" })
              .setLngLat([longitude, latitude])
              .setPopup(new mapboxgl.Popup().setHTML("<b>You are here</b>"))
              .addTo(map.current);

            // Wait for map to load before adding layers
            map.current.on("load", () => {
              console.log("Map loaded successfully");
              setMapLoaded(true);
              fetchStoreRatings();
            });

            map.current.on("error", (e) => {
              console.error("Mapbox error:", e);
              setMapError(e.error);
            });

            // Add click event to map
            map.current.on("click", (e) => {
              const features = map.current.queryRenderedFeatures(e.point, {
                layers: ["unclustered-point"],
              });

              if (features.length > 0) {
                const feature = features[0];
                const coordinates = feature.geometry.coordinates;

                // Create store object with all properties including comments
                const store = {
                  storeName: feature.properties.storeName,
                  lng: coordinates[0],
                  lat: coordinates[1],
                  comments: feature.properties.comments || [],
                  avgRating: feature.properties.avgRating,
                  ratingCount: feature.properties.ratingCount,
                  totalRatings: feature.properties.totalRatings,
                  ratingDistribution: feature.properties.ratingDistribution
                };

                console.log("Selected store:", store); // Debug log
                setSelectedStore(store);
                setShowComments(false); // Reset comments visibility

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
    if (map.current && mapLoaded) {
      fetchStoreRatings();
    }
  }, [mapLoaded]);

  // Update top stores when user location changes
  useEffect(() => {
    if (userLocation && map.current) {
      updateTopStores();
    }
  }, [userLocation]);

  const updateTopStores = () => {
    if (!userLocation || !map.current) return;

    const storesSource = map.current.getSource("stores");
    if (!storesSource) return;

    try {
      const storesData = storesSource._data.features;
      const nearbyStores = storesData
        .filter((store) => {
          const [lng, lat] = store.geometry.coordinates;
          const distance = getDistanceFromLatLonInKm(
            userLocation.lat,
            userLocation.lng,
            lat,
            lng
          );
          return distance <= 6; // Within 6km
        })
        .sort((a, b) => b.properties.avgRating - a.properties.avgRating)
        .slice(0, 5); // Top 5 stores

      setTopStores(nearbyStores);
    } catch (error) {
      console.error("Error updating top stores:", error);
      setTopStores([]);
    }
  };

  const fetchStoreRatings = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "storeRatings"));
      let ratingsData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.storeName && data.lat && data.lng) {
          ratingsData.push({
            id: doc.id,
            storeName: data.storeName,
            lat: data.lat,
            lng: data.lng,
            rating: data.rating,
            comment: data.comment,
            timestamp: data.timestamp,
            userId: data.userId,
            userEmail: data.userEmail
          });
        }
      });

      // Group stores by location and calculate averages
      let storeGroups = {};
      ratingsData.forEach(({ storeName, lat, lng, rating, comment, timestamp, userId, userEmail }) => {
        // Find if this store is near any existing group
        let foundGroup = false;
        for (const key in storeGroups) {
          const [groupLat, groupLng] = key.split(',').map(Number);
          if (isWithinRadius(lat, lng, groupLat, groupLng, 10)) { // 10 meters radius
            storeGroups[key].ratings.push(rating);
            if (comment) {
              if (!storeGroups[key].comments) {
                storeGroups[key].comments = [];
              }
              storeGroups[key].comments.push({
                text: comment,
                timestamp,
                userId,
                userEmail
              });
            }
            storeGroups[key].timestamps.push(timestamp);
            foundGroup = true;
            break;
          }
        }

        // If no nearby group found, create new group
        if (!foundGroup) {
          const key = `${lat},${lng}`;
          storeGroups[key] = {
            storeName,
            lat,
            lng,
            ratings: [rating],
            comments: comment ? [{
              text: comment,
              timestamp,
              userId,
              userEmail
            }] : [],
            timestamps: [timestamp],
            coordinates: [lng, lat],
          };
        }
      });

      // Calculate averages and prepare GeoJSON
      const geojson = {
        type: "FeatureCollection",
        features: Object.values(storeGroups).map(
          ({ storeName, coordinates, ratings, comments, timestamps }) => {
            const avgRating =
              ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

            return {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates,
              },
              properties: {
                storeName,
                avgRating: parseFloat(avgRating.toFixed(1)),
                ratingCount: ratings.length,
                comments: comments || [],
                totalRatings: ratings.length,
                ratingDistribution: {
                  1: ratings.filter((r) => r === 1).length,
                  2: ratings.filter((r) => r === 2).length,
                  3: ratings.filter((r) => r === 3).length,
                  4: ratings.filter((r) => r === 4).length,
                  5: ratings.filter((r) => r === 5).length,
                },
              },
            };
          }
        ),
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
          clusterRadius: 50,
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
              10,
              "#f1f075",
              30,
              "#f28cb1",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              10,
              30,
              30,
              40,
            ],
          },
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
            "text-size": 12,
          },
        });

        // Add store markers
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
              3,
              "#ffbb33", // 3 stars
              4,
              "#00C851", // 4-5 stars
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "ratingCount"],
              1,
              6,
              10,
              8,
              50,
              10,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });
      }

      // Only update top stores if user location is available
      if (userLocation) {
        updateTopStores();
      }
    } catch (error) {
      console.error("Error fetching store ratings:", error);
      setMessage({ text: "Failed to load store ratings", type: "error" });
      setTopStores([]); // Reset top stores on error
    } finally {
      setLoading(false);
    }
  };

  const getDirections = async (destination) => {
    if (!userLocation) {
      setMessage({
        text: "Please allow location access to get directions",
        type: "error",
      });
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
          suggestedMode = "walking";
          suggestionReason = "This location is within walking distance (less than 1 km). Walking is the most sustainable option for short distances.";
        } else if (distance <= 5) {
          suggestedMode = "bicycling";
          suggestionReason = "This location is perfect for cycling (1-5 km). Cycling is a great sustainable option for medium distances.";
        } else {
          suggestedMode = "transit";
          suggestionReason = "This location is a bit far. Consider using public transportation to reduce your carbon footprint.";
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
            geometry: route.geometry,
          },
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#4CAF50",
            "line-width": 4,
            "line-opacity": 0.75,
          },
        });

        // Update store details with route information and suggestion
        setSelectedStore((prev) => ({
          ...prev,
          distance: `${distance.toFixed(1)} km`,
          duration: `${duration} min`,
          suggestedMode,
          suggestionReason,
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
          duration: 1000,
        });
      } else {
        setMessage({ text: "No route found", type: "error" });
      }
    } catch (error) {
      console.error("Error getting directions:", error);
      setMessage({ text: "Failed to get directions", type: "error" });
    }
  };

  // Helper function to get distance between two points (Haversine formula)
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      0.5 -
      Math.cos(dLat) / 2 +
      (Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        (1 - Math.cos(dLon))) /
        2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  // Tracker: Show green lines to sustainable stores (rating >= 3) within 4km
  const handleShowTracker = async () => {
    if (!userLocation) return;
    setShowTracker(!showTracker);
    setNearbyRoutes([]);

    // Remove previous tracker routes if toggling off
    if (showTracker && map.current.getSource("tracker-routes")) {
      map.current.removeLayer("tracker-routes");
      map.current.removeSource("tracker-routes");
      return;
    }

    // Get all stores from the map source
    const storesSource = map.current.getSource("stores");
    if (!storesSource) return;

    const storesData = storesSource._data.features;
    const nearby = storesData.filter((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const avgRating = f.properties.avgRating;
      return (
        getDistanceFromLatLonInKm(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng
        ) <= 4 && avgRating >= 3
      );
    });

    // For each nearby store, get route and draw
    const routes = [];
    for (const store of nearby) {
      const origin = `${userLocation.lng.toFixed(6)},${userLocation.lat.toFixed(
        6
      )}`;
      const dest = `${store.geometry.coordinates[0].toFixed(
        6
      )},${store.geometry.coordinates[1].toFixed(6)}`;
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
            coordinates: store.geometry.coordinates,
          });
        }
      }
    }

    // Remove previous tracker routes
    if (map.current.getSource("tracker-routes")) {
      map.current.removeLayer("tracker-routes");
      map.current.removeSource("tracker-routes");
    }

    // Add all routes as a MultiLineString
    if (routes.length > 0) {
      map.current.addSource("tracker-routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: routes.map((r) => ({
            type: "Feature",
            geometry: r.geometry,
            properties: { storeName: r.storeName },
          })),
        },
      });

      map.current.addLayer({
        id: "tracker-routes",
        type: "line",
        source: "tracker-routes",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#43a047", // Green
          "line-width": 3,
          "line-opacity": 0.7,
          "line-dasharray": [2, 2],
        },
      });
    }

    setNearbyRoutes(routes);
  };

  // Update the createStorePopup function to show comment count
  const createStorePopup = (store) => {
    return `
      <div class="p-3">
        <h3 class="font-bold text-base mb-1">${store.properties.storeName}</h3>
        <div class="flex items-center">
          <div class="flex text-yellow-500">
            ${"★".repeat(Math.round(store.properties.avgRating))}${"☆".repeat(
      5 - Math.round(store.properties.avgRating)
    )}
          </div>
          <span class="ml-2 text-sm">${store.properties.avgRating.toFixed(
            1
          )}</span>
          <span class="ml-1 text-sm text-gray-500">(${
            store.properties.totalRatings
          } ratings)</span>
        </div>
      </div>
    `;
  };

  const handleDirectionsClick = () => {
    if (!directionsShown) {
      getDirections(selectedStore);
      setDirectionsShown(true);
      setTimeout(() => {
        if (userLocation && selectedStore) {
          const origin = `${userLocation.lat},${userLocation.lng}`;
          const destination = `${selectedStore.lat},${selectedStore.lng}`;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
          window.open(url, "_blank");
        }
      }, 3000);
    } else {
      if (userLocation && selectedStore) {
        const origin = `${userLocation.lat},${userLocation.lng}`;
        const destination = `${selectedStore.lat},${selectedStore.lng}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
        window.open(url, "_blank");
      }
    }
  };

  // Add this helper function to check if two locations are within a certain radius
  const isWithinRadius = (lat1, lng1, lat2, lng2, radiusInMeters) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusInMeters;
  };

  // Add this function to find nearby store ratings
  const findNearbyStoreRating = async (storeName, lat, lng) => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const ratingsRef = collection(db, "storeRatings");
      const querySnapshot = await getDocs(ratingsRef);
      
      // Find ratings for the same store within 10 meters
      for (const doc of querySnapshot.docs) {
        const rating = doc.data();
        if (
          rating.storeName === storeName &&
          isWithinRadius(lat, lng, rating.lat, rating.lng, 10) // 10 meters radius
        ) {
          return {
            id: doc.id,
            ...rating
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Error finding nearby store rating:", error);
      return null;
    }
  };

  // Update the handleRatingSubmit function
  const handleRatingSubmit = async () => {
    if (!userLocation) {
      setMessage({ text: "Location not detected!", type: "error" });
      return;
    }

    if (!storeName.trim()) {
      setMessage({ text: "Please enter a store name", type: "error" });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setMessage({ text: "Please sign in to rate stores", type: "error" });
      return;
    }

    try {
      const ratingData = {
        storeName: storeName.trim(),
        comment: comment.trim(),
        lat: userLocation.lat,
        lng: userLocation.lng,
        rating,
        timestamp: new Date(),
        userId: user.uid,
        userEmail: user.email
      };

      // Check for nearby existing rating
      const nearbyRating = await findNearbyStoreRating(
        storeName.trim(),
        userLocation.lat,
        userLocation.lng
      );

      if (nearbyRating) {
        // Update existing rating
        await updateDoc(doc(db, "storeRatings", nearbyRating.id), ratingData);
        setMessage({ text: "Rating updated successfully!", type: "success" });
      } else {
        // Create new rating
        await addDoc(collection(db, "storeRatings"), ratingData);
        setMessage({ text: "Rating submitted successfully!", type: "success" });
      }

      // Reset form
      setStoreName("");
      setComment("");
      setCommentError("");
      setRatingFormVisible(false);
      setExistingRating(null);
      
      // Refresh store data
      fetchStoreRatings();
    } catch (error) {
      console.error("Error submitting rating:", error);
      setMessage({
        text: "Failed to submit rating. Please try again.",
        type: "error",
      });
    }
  };

  // Update the checkUserRating function
  const checkUserRating = async (storeName, lat, lng) => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const ratingsRef = collection(db, "storeRatings");
      const querySnapshot = await getDocs(ratingsRef);
      
      // Find user's rating for this store within 10 meters
      for (const doc of querySnapshot.docs) {
        const rating = doc.data();
        if (
          rating.userId === user.uid &&
          rating.storeName === storeName &&
          isWithinRadius(lat, lng, rating.lat, rating.lng, 10) // 10 meters radius
        ) {
          return {
            id: doc.id,
            ...rating
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Error checking user rating:", error);
      return null;
    }
  };

  // Rating Form Component
  const RatingForm = React.memo(() => {
    const [localStoreName, setLocalStoreName] = useState("");
    const [localComment, setLocalComment] = useState("");
    const [localRating, setLocalRating] = useState(3);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      const checkRating = async () => {
        if (selectedStore) {
          const rating = await checkUserRating(
            selectedStore.storeName,
            selectedStore.lat,
            selectedStore.lng
          );
          if (rating) {
            setExistingRating(rating);
            setLocalStoreName(rating.storeName);
            setLocalRating(rating.rating);
            setLocalComment(rating.comment || "");
          } else {
            setExistingRating(null);
            setLocalStoreName(selectedStore.storeName);
            setLocalRating(3);
            setLocalComment("");
          }
        }
        setIsChecking(false);
      };
      checkRating();
    }, [selectedStore]);

    const handleSubmit = async () => {
      if (!userLocation) {
        setMessage({ text: "Location not detected!", type: "error" });
        return;
      }

      if (!localStoreName.trim()) {
        setMessage({ text: "Please enter a store name", type: "error" });
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setMessage({ text: "Please sign in to rate stores", type: "error" });
        return;
      }

      try {
        const ratingData = {
          storeName: localStoreName.trim(),
          comment: localComment.trim(),
          lat: userLocation.lat,
          lng: userLocation.lng,
          rating: localRating,
          timestamp: new Date(),
          userId: user.uid,
          userEmail: user.email
        };

        // Check for nearby existing rating
        const nearbyRating = await findNearbyStoreRating(
          localStoreName.trim(),
          userLocation.lat,
          userLocation.lng
        );

        if (nearbyRating) {
          // Update existing rating
          await updateDoc(doc(db, "storeRatings", nearbyRating.id), ratingData);
          setMessage({ text: "Rating updated successfully!", type: "success" });
        } else {
          // Create new rating
          await addDoc(collection(db, "storeRatings"), ratingData);
          setMessage({ text: "Rating submitted successfully!", type: "success" });
        }

        // Reset form
        setLocalStoreName("");
        setLocalComment("");
        setLocalRating(3);
        setRatingFormVisible(false);
        setExistingRating(null);
        
        // Refresh store data
        fetchStoreRatings();
      } catch (error) {
        console.error("Error submitting rating:", error);
        setMessage({
          text: "Failed to submit rating. Please try again.",
          type: "error",
        });
      }
    };

    if (isChecking) {
      return <Spinner />;
    }

    return (
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-5">
        <div className="p-5 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">
              {existingRating ? "Update Your Rating" : "Rate This Location"}
            </h3>
            <button
              onClick={() => {
                setRatingFormVisible(false);
                setExistingRating(null);
                setLocalStoreName("");
                setLocalComment("");
                setLocalRating(3);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {existingRating && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
              You have already rated this store. You can update your rating below.
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={localStoreName}
              onChange={(e) => setLocalStoreName(e.target.value)}
              placeholder="Enter store name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setLocalRating(star)}
                  className="text-2xl focus:outline-none transition-colors"
                >
                  <FaStar
                    className={
                      star <= localRating ? "text-yellow-500" : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Comment (optional)
            </label>
            <textarea
              value={localComment}
              onChange={(e) => setLocalComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="3"
            ></textarea>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {existingRating ? "Update Rating" : "Submit Rating"}
          </button>
        </div>
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50/30 font-sans">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20 pointer-events-none">
        <BackgroundIcons />
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-lg px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-50 text-green-600 md:hidden"
          >
            <FaBars className="text-lg" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white">
              <FaStore className="text-sm" />
            </div>
            <h1 className="font-bold text-green-800">Store Ratings</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                signOut(auth);
                navigate("/login");
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="text-sm" />
              <span className="text-sm font-medium">Logout</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              {auth.currentUser?.photoURL ? (
                <img
                  src={auth.currentUser.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-medium text-sm">
                  {auth.currentUser?.displayName?.charAt(0) || "U"}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Side Navigation */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-sm z-40 transform transition-all duration-300 ease-in-out ${
          menuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } md:translate-x-0 md:shadow-xl pt-20`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 px-3 py-6">
            {/* User profile area */}
            <div className="mb-8 px-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-md">
                  {auth.currentUser?.photoURL ? (
                    <img
                      src={auth.currentUser.photoURL}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {auth.currentUser?.displayName?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {auth.currentUser?.displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[160px]">
                    {auth.currentUser?.email || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 pl-2">
                Main menu
              </p>
              <ul className="space-y-2.5">
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/dashboard");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaCamera className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Scanner</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/bill-scanner");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaFileInvoice className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Bill scanner</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/store-ratings");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <FaStore className="text-white text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Store ratings</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/sustainavoice");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaComments className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Sustainavoice</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/history");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaHistory className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
                    </div>
                    <span>History</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider with pattern */}
          <div className="px-6 py-2">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          </div>

          {/* Sign out section */}
          <div className="p-4">
            <button
              onClick={() => {
                signOut(auth);
                navigate("/login");
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <FaSignOutAlt className="text-red-500 text-sm group-hover:rotate-12 transition-transform" />
              </div>
              <span className="text-gray-600 group-hover:text-red-600 transition-colors">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4 md:pl-72 transition-all duration-300">
        <div className="max-w-xl mx-auto">
          {/* Title Section */}
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Store Sustainability Map
            </h2>
            <p className="text-gray-600 mb-1">
              Discover sustainable stores around you
            </p>

            {message.text && (
              <div
                className={`mt-2 px-4 py-2 rounded-lg ${
                  message.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-5">
            <div className="p-4">
              <div
                ref={mapContainer}
                className="rounded-xl overflow-hidden"
                style={{ height: "400px" }}
              />

              {/* Map Controls */}
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={handleShowTracker}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    showTracker
                      ? "bg-green-600 text-white"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  } transition-colors`}
                >
                  <FaLeaf className="text-sm" />
                  <span>
                    {showTracker
                      ? "Hide Sustainable Routes"
                      : "Show Sustainable Routes"}
                  </span>
                </button>

                <button
                  onClick={() => setRatingFormVisible(!ratingFormVisible)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-sm transition-colors"
                >
                  <FaStar className="text-sm" />
                  <span>Rate This Location</span>
                </button>
              </div>
            </div>
          </div>

          {/* Top Stores This Week */}
          {topStores.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-5">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FaStar className="text-yellow-500" />
                  Top Stores This Week
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Highly rated stores within 6km of your location
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {topStores.map((store, index) => (
                  <div
                    key={store.properties.storeName}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      const coordinates = store.geometry.coordinates;
                      map.current.flyTo({
                        center: coordinates,
                        zoom: 15,
                        duration: 2000
                      });

                      // Ensure comments is an array
                      const comments = Array.isArray(store.properties.comments) 
                        ? store.properties.comments 
                        : [];

                      setSelectedStore({
                        storeName: store.properties.storeName,
                        lng: coordinates[0],
                        lat: coordinates[1],
                        comments: comments,
                        avgRating: store.properties.avgRating,
                        ratingCount: store.properties.ratingCount,
                        totalRatings: store.properties.totalRatings,
                        ratingDistribution: store.properties.ratingDistribution
                      });
                      setShowComments(false); // Reset comments visibility
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {store.properties.storeName}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={
                                    i < Math.round(store.properties.avgRating)
                                      ? "text-yellow-500"
                                      : "text-gray-300"
                                  }
                                  size={12}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              ({store.properties.totalRatings} ratings)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {store.properties.avgRating.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getDistanceFromLatLonInKm(
                            userLocation.lat,
                            userLocation.lng,
                            store.geometry.coordinates[1],
                            store.geometry.coordinates[0]
                          ).toFixed(1)} km
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Store Card */}
          {selectedStore && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-5">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {selectedStore.storeName}
                    </h3>
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={
                              i < Math.round(selectedStore.avgRating)
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-gray-600">
                        {selectedStore.avgRating?.toFixed(1)} (
                        {selectedStore.ratingCount} ratings)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                    >
                      <FaComments className="text-sm" />
                      <span className="text-sm">
                        {showComments ? "Hide Comments" : "Show Comments"}
                      </span>
                    </button>
                    <button
                      onClick={handleDirectionsClick}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <FaDirections className="text-sm" />
                      <span className="text-sm">Get Directions</span>
                    </button>
                  </div>
                </div>

                {showComments && (
                  <div className="mt-4 space-y-4">
                    <h4 className="font-medium text-gray-800">All Comments</h4>
                    {selectedStore.comments && selectedStore.comments.length > 0 ? (
                      selectedStore.comments.map((comment, index) => {
                        const anonymousName = generateAnonymousName();
                        const nameInitial = anonymousName.charAt(0);
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium">
                                  {nameInitial}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {anonymousName}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {comment.timestamp?.toDate?.()?.toLocaleDateString() || "Recently"}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{comment.text}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No comments yet. Be the first to review this store!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Route Details */}
              {selectedStore.distance && selectedStore.duration && (
                <div className="p-4 bg-green-50">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700 font-medium">Distance:</span>
                    <span className="text-gray-900">{selectedStore.distance}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-700 font-medium">Walking Time:</span>
                    <span className="text-gray-900">{selectedStore.duration}</span>
                  </div>

                  {/* Sustainable Travel Suggestion */}
                  <div className="bg-white rounded-lg p-3 mt-2">
                    <h4 className="text-green-700 font-bold flex items-center gap-2 mb-2">
                      <FaLeaf className="text-green-600" />
                      Sustainable Travel Suggestion
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {selectedStore.suggestionReason}
                    </p>
                    <div className="flex justify-center text-3xl">
                      {selectedStore.suggestedMode === "walking" && (
                        <FaWalking className="text-green-600" />
                      )}
                      {selectedStore.suggestedMode === "bicycling" && (
                        <FaBicycle className="text-green-600" />
                      )}
                      {selectedStore.suggestedMode === "transit" && (
                        <FaBus className="text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rating Form */}
          {ratingFormVisible && <RatingForm />}

          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-5">
            <div className="p-5">
              <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
                <FaInfoCircle className="text-green-600" />
                About Store Ratings
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 mt-0.5"></div>
                  <span>
                    Red markers: Stores with low sustainability ratings (below
                    3)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-yellow-500 mt-0.5"></div>
                  <span>
                    Yellow markers: Stores with moderate sustainability ratings
                    (3)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 mt-0.5"></div>
                  <span>
                    Green markers: Stores with high sustainability ratings (4-5)
                  </span>
                </li>
                <li className="flex items-start gap-2 mt-2">
                  <FaLeaf className="text-green-600 mt-0.5" />
                  <span>
                    Use the "Show Sustainable Routes" button to view paths to
                    sustainable stores near you
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom navigation for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center py-2 px-3 text-gray-500"
          >
            <FaCamera />
            <span className="text-xs mt-1">Scan</span>
          </button>

          <button
            onClick={() => navigate("/bill-scanner")}
            className="flex flex-col items-center py-2 px-3 text-gray-500"
          >
            <FaFileInvoice />
            <span className="text-xs mt-1">Bills</span>
          </button>

          <button
            onClick={() => navigate("/store-ratings")}
            className="flex flex-col items-center py-2 px-3 text-green-600"
          >
            <FaStore />
            <span className="text-xs mt-1">Stores</span>
          </button>

          <button
            onClick={() => navigate("/history")}
            className="flex flex-col items-center py-2 px-3 text-gray-500"
          >
            <FaHistory />
            <span className="text-xs mt-1">History</span>
          </button>
        </div>
      </nav>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-xl flex flex-col items-center">
            <Spinner />
            <p className="mt-2 text-gray-700">Loading store data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreRatings;

import React, { useState, useEffect, useRef } from "react";
import {
  FaBars,
  FaStore,
  FaFileInvoice,
  FaHistory,
  FaRecycle,
  FaCamera,
  FaSignOutAlt,
  FaComments,
  FaLeaf,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import BackgroundIcons from "../BackgroundIcons";

// Spinner component for loading states
const Spinner = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
      <FaHistory className="text-green-300 text-xl" />
    </div>
    <h3 className="text-lg font-medium text-gray-800 mb-2">No history yet</h3>
    <p className="text-gray-500 text-center mb-6">
      Scan products to see your history here
    </p>
    <button
      onClick={() => (window.location.href = "/dashboard")}
      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
    >
      Scan a product
    </button>
  </div>
);

// Card badge component
const SustainabilityBadge = ({ score }) => {
  const getColor = () => {
    if (!score || score < 2) return "bg-red-100 text-red-800";
    if (score < 3.5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div
      className={`${getColor()} px-2 py-1 rounded-full text-xs font-medium inline-flex items-center`}
    >
      <FaLeaf className="mr-1 text-xs" />
      <span>{score ? `${score}/5` : "N/A"}</span>
    </div>
  );
};

const History = () => {
  const [history, setHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedTips, setExpandedTips] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const historyContainerRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    const historyRef = collection(db, "history");
    const q = query(
      historyRef,
      where("userId", "==", user.uid),
      orderBy("dateScanned", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const historyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHistory(historyData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleRecyclingTips = (id) => {
    setExpandedTips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50/30 font-sans">
      {/* Semi-transparent overlay when menu is open on mobile */}
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
              <FaHistory className="text-sm" />
            </div>
            <h1 className="font-bold text-green-800">History</h1>
          </div>

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
      </header>

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
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaStore className="text-green-600 text-sm group-hover:scale-110 transition-transform" />
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
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <FaHistory className="text-white text-sm group-hover:scale-110 transition-transform" />
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
          {/* Title and description */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your scan history
            </h2>
            <p className="text-gray-600">
              Review products you've previously scanned
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-5 text-center">
              <Spinner />
              <p className="mt-2 text-gray-600">Loading your history...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && history.length === 0 && <EmptyState />}

          {/* History Cards */}
          {!loading && history.length > 0 && (
            <div className="space-y-4" ref={historyContainerRef}>
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">
                      {item.productName || "Unknown Product"}
                    </h3>
                    <SustainabilityBadge score={item.sustainabilityScore} />
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Product Image */}
                      {item.imageUrl && (
                        <div className="w-full md:w-1/3 flex-shrink-0">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={item.imageUrl}
                              alt={item.productName || "Scanned Product"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-sm font-medium">
                              Brand:
                            </span>
                            <span className="text-gray-800 text-sm">
                              {item.brand || "Unknown"}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-sm font-medium">
                              Packaging:
                            </span>
                            <span className="text-gray-800 text-sm">
                              {item.packagingMaterial || "Not available"}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-sm font-medium">
                              Ingredients:
                            </span>
                            <span className="text-gray-800 text-sm">
                              {item.ingredientsImpact || "Not available"}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-sm font-medium">
                              Recycling:
                            </span>
                            <span className="text-gray-800 text-sm">
                              {item.recyclingFeasibility || "Not available"}
                            </span>
                          </div>
                        </div>

                        {/* Scan Date */}
                        <div className="text-xs text-gray-500 mt-2">
                          Scanned on{" "}
                          {item.dateScanned
                            ? item.dateScanned.toDate().toLocaleString()
                            : "unknown date"}
                        </div>
                      </div>
                    </div>

                    {/* Health Impact Section */}
                    {item.healthimpact && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <span className="mr-1">❤️</span> Health impact
                        </h4>
                        <p className="text-gray-700 text-sm">
                          {item.healthimpact}
                        </p>
                      </div>
                    )}

                    {/* Recycling Tips Section */}
                    <div className="mt-4 pt-2">
                      <button
                        onClick={() => toggleRecyclingTips(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          expandedTips[item.id]
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="flex items-center">
                          <FaRecycle className="mr-2" />
                          Recycling tips
                        </span>
                        {expandedTips[item.id] ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </button>

                      {/* Expandable Content */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          expandedTips[item.id]
                            ? "max-h-96 opacity-100 mt-3"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-gray-700 text-sm">
                            {item.recyclingtips ||
                              "No recycling tips available for this product."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            className="flex flex-col items-center py-2 px-3 text-gray-500"
          >
            <FaStore />
            <span className="text-xs mt-1">Stores</span>
          </button>

          <button
            onClick={() => navigate("/history")}
            className="flex flex-col items-center py-2 px-3 text-green-600"
          >
            <FaHistory />
            <span className="text-xs mt-1">History</span>
          </button>
        </div>
      </nav>

      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20 pointer-events-none">
        <BackgroundIcons />
      </div>
    </div>
  );
};

export default History;

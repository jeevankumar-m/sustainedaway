import React, { useEffect } from "react";
import {
  FaLeaf,
  FaHistory,
  FaMapMarkedAlt,
  FaCamera,
  FaUser,
  FaHeartbeat,
  FaRecycle,
  FaCommentDots,
  FaArrowRight,
  FaChevronDown,

//Reverted some changes
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Motion Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const fadeIn = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 10,
    },
  },
};

const zoomIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 100,
    },
  },
};

const slideIn = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 10,
    },
  },
};

const features = [
  {
    icon: <FaRecycle className="text-emerald-500 text-3xl mb-3" />,
    title: "AI Sustainability Score",
    desc: "Get instant eco-impact ratings for any product you scan, with detailed breakdowns and alternative suggestions.",
    img: (
      <div className="w-full h-32 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-xl flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🌍</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500/80 to-transparent p-3 text-white font-medium text-sm">
            Eco Rating
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <FaHeartbeat className="text-rose-500 text-3xl mb-3" />,
    title: "Health Checker",
    desc: "Personalized ingredient analysis based on your dietary preferences, allergies, and health conditions.",
    img: (
      <div className="w-full h-32 bg-gradient-to-br from-rose-100 to-pink-50 rounded-xl flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">❤️</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rose-500/80 to-transparent p-3 text-white font-medium text-sm">
            Health Scan
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <FaMapMarkedAlt className="text-blue-500 text-3xl mb-3" />,
    title: "Sustainability Map",
    desc: "Discover eco-friendly stores and businesses near you with community ratings and sustainability metrics.",
    img: (
      <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-xl flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🗺️</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/80 to-transparent p-3 text-white font-medium text-sm">
            Local Guide
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <FaHistory className="text-amber-500 text-3xl mb-3" />,
    title: "History Log",
    desc: "Track your sustainability journey with detailed history of scans, improvements, and environmental impact over time.",
    img: (
      <div className="w-full h-32 bg-gradient-to-br from-amber-100 to-yellow-50 rounded-xl flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">📊</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500/80 to-transparent p-3 text-white font-medium text-sm">
            Your Progress
          </div>
        </div>
      </div>
    ),
  },
];

const AnimatedSection = ({ children, id }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      id={id}
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen  w-full bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 font-sans flex flex-col relative">
      {/* Fixed Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full flex items-center justify-between px-6 py-4 fixed top-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-lg shadow-md border-b border-emerald-100"
            : "bg-transparent"
        }`}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full p-2 shadow-lg shadow-emerald-200">
            <img
              src="./favicon.ico"
              alt="Logo"
              className="w-8 h-8 rounded-full bg-white"
            />
          </div>
          <span
            className={`text-xl font-extrabold ${
              scrolled ? "text-emerald-800" : "text-emerald-700 text-shadow"
            }`}
          >
            SustainedAway
          </span>
        </motion.div>

        <div className="hidden md:flex items-center gap-6">
          <motion.a
            whileHover={{ y: -2 }}
            href="#features"
            className={`font-medium text-sm transition-colors ${
              scrolled ? "text-emerald-700" : "text-white/90"
            }`}
          >
            Features
          </motion.a>
          <motion.a
            whileHover={{ y: -2 }}
            href="#map"
            className={`font-medium text-sm transition-colors ${
              scrolled ? "text-emerald-700" : "text-white/90"
            }`}
          >
            Map
          </motion.a>
          <motion.a
            whileHover={{ y: -2 }}
            href="#feedback"
            className={`font-medium text-sm transition-colors ${
              scrolled ? "text-emerald-700" : "text-white/90"
            }`}
          >
            Feedback
          </motion.a>
          <div className="h-6 w-px bg-emerald-200 mx-2"></div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/20 backdrop-blur-md text-emerald-600 rounded-full px-5 py-2 text-sm font-medium shadow-md border border-white/30 hover:bg-white/30 transition-all"
            onClick={() => navigate("/login")}
          >
            Login
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full px-5 py-2 text-sm font-medium shadow-md hover:shadow-lg hover:shadow-emerald-200/50 transition-all"
            onClick={() => navigate("/login", { state: { register: true } })}
          >
            Sign Up
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="block md:hidden rounded-full p-2 bg-white/20 backdrop-blur-sm shadow-sm border border-white/30"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className="w-full h-0.5 bg-emerald-600 rounded-full"></span>
            <span className="w-3/4 h-0.5 bg-emerald-600 rounded-full self-end"></span>
            <span className="w-full h-0.5 bg-emerald-600 rounded-full"></span>
          </div>
        </motion.button>
      </motion.nav>

      {/* Hero Section */}
      <section className="w-full min-h-screen flex flex-col items-center justify-center pt-16 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-teal-300/20 blur-3xl"></div>
          <div className="absolute top-1/3 -left-20 w-60 h-60 rounded-full bg-emerald-300/20 blur-3xl"></div>
          <div className="absolute bottom-20 right-1/3 w-40 h-40 rounded-full bg-cyan-300/20 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <AnimatedSection>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
              {/* Hero Text */}
              <motion.div
                variants={fadeIn}
                className="w-full lg:w-1/2 text-center lg:text-left"
              >
                <span className="inline-block bg-emerald-500/10 text-emerald-700 font-medium px-4 py-1 rounded-full mb-4 border border-emerald-200 text-sm">
                  ✨ Make better choices for our planet
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-emerald-900 mb-6 leading-tight">
                  Track. Rate. <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Live Sustainably.
                  </span>
                </h1>
                <p className="text-base md:text-lg text-emerald-700 mb-8 max-w-md lg:max-w-xl">
                  Instantly scan products and bills to discover their
                  sustainability scores. Make informed choices for your health
                  and the planet with our AI-powered app.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-emerald-200/50 hover:shadow-xl transition flex items-center gap-2"
                    onClick={() => navigate("/login")}
                  >
                    Get Started – It's Free <FaArrowRight className="ml-1" />
                  </motion.button>
                  <motion.a
                    href="#features"
                    whileHover={{ scale: 1.05 }}
                    className="text-emerald-700 font-medium px-6 py-3 rounded-full border border-emerald-300 hover:bg-emerald-50 transition flex items-center"
                  >
                    Learn More <FaChevronDown className="ml-2" />
                  </motion.a>
                </div>
              </motion.div>

              {/* Hero Image/App Preview */}
              <motion.div variants={zoomIn} className="w-full lg:w-1/2">
                <div className="relative mx-auto max-w-md">
                  {/* Phone mockup frame */}
                  <div className="bg-gradient-to-br from-emerald-300 to-teal-500 p-3 rounded-[2.5rem] shadow-2xl">
                    <div className="bg-black rounded-[2rem] p-2 overflow-hidden">
                      {/* App screen */}
                      <div className="bg-white rounded-[1.7rem] overflow-hidden h-[500px] flex flex-col relative">
                        {/* App header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">SustainedAway</span>
                            <FaUser className="text-sm" />
                          </div>
                          <div className="mt-6">
                            <h3 className="text-xs font-light">Scan Product</h3>
                            <h2 className="font-bold mt-1">Product Scanner</h2>
                          </div>
                        </div>

                        {/* App content */}
                        <div className="flex-1 flex items-center justify-center bg-emerald-50 p-4">
                          <div className="text-center bg-white p-8 rounded-2xl shadow-md w-full">
                            <FaCamera className="text-emerald-500 text-4xl mx-auto mb-6 animate-pulse" />
                            <div className="bg-emerald-500 w-16 h-1 mx-auto mb-6 rounded-full"></div>
                            <p className="text-emerald-900 font-medium mb-2">
                              Scan a Product
                            </p>
                            <p className="text-emerald-600 text-xs">
                              Align barcode or product in frame
                            </p>
                          </div>
                        </div>

                        {/* App bottom nav */}
                        <div className="bg-white p-4 border-t border-gray-200 flex justify-around">
                          <div className="text-emerald-500 text-center">
                            <FaCamera className="mx-auto text-lg" />
                            <span className="text-xs mt-1">Scan</span>
                          </div>
                          <div className="text-gray-400 text-center">
                            <FaHistory className="mx-auto text-lg" />
                            <span className="text-xs mt-1">History</span>
                          </div>
                          <div className="text-gray-400 text-center">
                            <FaMapMarkedAlt className="mx-auto text-lg" />
                            <span className="text-xs mt-1">Map</span>
                          </div>
                          <div className="text-gray-400 text-center">
                            <FaUser className="mx-auto text-lg" />
                            <span className="text-xs mt-1">Profile</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -z-10 top-1/4 -left-8 w-16 h-16 rounded-full bg-yellow-300 blur-md opacity-40"></div>
                  <div className="absolute -z-10 bottom-1/4 -right-8 w-20 h-20 rounded-full bg-emerald-300 blur-md opacity-30"></div>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
          >
            <div className="w-8 h-12 rounded-full border-2 border-emerald-400 flex justify-center">
              <div className="w-1 h-3 bg-emerald-400 rounded-full mt-2"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <AnimatedSection id="features">
        <section className="w-full px-4 py-16 md:py-24 bg-white bg-opacity-70 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <motion.div variants={fadeIn} className="text-center mb-16">
              <span className="inline-block bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full mb-4 text-sm font-medium">
                Powerful Tools
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-4">
                Everything You Need For Sustainable Living
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-teal-500 mx-auto rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn}
                  whileHover={{
                    y: -8,
                    boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
                    transition: { type: "spring", stiffness: 300 },
                  }}
                  className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 group h-full flex flex-col"
                >
                  {/* Feature image */}
                  {feature.img}

                  {/* Feature content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="rounded-full p-2 bg-gradient-to-br from-gray-50 to-gray-100 w-fit mb-2 shadow-sm">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 flex-grow">
                      {feature.desc}
                    </p>
                    <motion.button
                      whileHover={{ x: 5 }}
                      className="self-start text-emerald-600 text-sm font-medium flex items-center group"
                    >
                      Learn more
                      <FaArrowRight className="ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Map Section */}
      <AnimatedSection id="map">
        <section className="w-full px-4 py-16 md:py-24">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <motion.div
                  variants={slideIn}
                  className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center order-2 md:order-1"
                >
                  <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full mb-4 text-xs font-medium">
                    FEATURE SPOTLIGHT
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    Sustainable Shopping Map
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Our interactive map guides you to eco-friendly businesses
                    and stores in your area. Filter by categories, see
                    sustainability ratings, and discover new places that align
                    with your values.
                  </p>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-start">
                      <div className="bg-blue-100 p-1 rounded-full mt-0.5 mr-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-700">
                        Find stores with best sustainability ratings
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-blue-100 p-1 rounded-full mt-0.5 mr-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-700">
                        Community reviews and recommendations
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-blue-100 p-1 rounded-full mt-0.5 mr-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-700">
                        Directions and walking/cycling routes
                      </span>
                    </li>
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="self-start bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2.5 rounded-full shadow-md hover:shadow-blue-200/50 hover:shadow-lg flex items-center gap-2"
                    onClick={() => navigate("/login")}
                  >
                    Explore Map <FaMapMarkedAlt className="ml-1" />
                  </motion.button>
                </motion.div>
                <motion.div
                  variants={zoomIn}
                  className="md:w-1/2 relative h-64 md:h-auto order-1 md:order-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-30"></div>
                  <div className="absolute inset-0 p-6 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg h-full w-full p-4 flex items-center justify-center">
                      <div className="text-center">
                        <FaMapMarkedAlt className="text-blue-500 text-5xl mx-auto mb-4" />
                        <div className="h-32 w-48 mx-auto bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg mb-4 flex items-center justify-center relative">
                          <div className="absolute w-8 h-8 bg-green-400 rounded-full -top-1 -left-1 border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                            4.9
                          </div>
                          <div className="absolute w-6 h-6 bg-red-400 rounded-full bottom-2 left-10 border-2 border-white"></div>
                          <div className="absolute w-7 h-7 bg-yellow-400 rounded-full top-10 right-6 border-2 border-white"></div>
                          <div className="absolute w-10 h-10 bg-blue-500 rounded-full bottom-4 right-3 border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                            YOU
                          </div>
                        </div>
                        <p className="text-blue-800 font-medium">
                          Interactive Sustainability Map
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Feedback Section */}
      <AnimatedSection id="feedback">
        <section className="w-full px-4 py-16 md:py-24 mt-3 bg-gradient-to-b from-transparent to-emerald-50">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              variants={fadeIn}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 md:p-10 text-center relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                  <FaCommentDots className="text-white text-3xl" />
                </div>
                <h3 className="text-white text-2xl md:text-3xl font-bold mb-4">
                  SustainaVoice 💬
                </h3>
                <p className="text-emerald-50 mb-8 max-w-lg mx-auto">
                  Your feedback strengthens our sustainability database and
                  helps us improve. Share your insights, report products, or
                  suggest new eco-friendly businesses to make a real difference.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-emerald-600 font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-white/30 transition flex items-center justify-center gap-2"
                    onClick={() => navigate("/login")}
                  >
                    Share Feedback <FaCommentDots className="ml-1" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-transparent border-2 border-white/70 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
                    onClick={() => navigate("/login")}
                  >
                    Join Our Community <FaLeaf className="ml-1" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="w-full px-4 py-8 bg-emerald-900 text-white mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="bg-white rounded-full p-2">
                <img
                  src="./favicon.ico"
                  alt="Logo"
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <span className="text-xl font-bold text-white">
                SustainedAway
              </span>
            </div>
            <div className="flex gap-6 mb-6 md:mb-0">
              <a
                href="#"
                className="text-emerald-200 hover:text-white transition"
              >
                About
              </a>
              <a
                href="#"
                className="text-emerald-200 hover:text-white transition"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-emerald-200 hover:text-white transition"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-emerald-200 hover:text-white transition"
              >
                Contact
              </a>
            </div>
            <div className="text-emerald-300 text-sm">
              © 2025 SustainedAway. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom navigation - Fixed at bottom on small screens */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 py-2 md:hidden z-40">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center justify-center text-emerald-600 px-2 py-1 w-1/4">
            <FaLeaf className="text-xl mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 transition-colors px-2 py-1 w-1/4"
            onClick={() => navigate("/login")}
          >
            <FaCamera className="text-xl mb-1" />
            <span className="text-xs font-medium">Scan</span>
          </button>
          <button
            className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 transition-colors px-2 py-1 w-1/4"
            onClick={() => navigate("/login")}
          >
            <FaMapMarkedAlt className="text-xl mb-1" />
            <span className="text-xs font-medium">Map</span>
          </button>
          <button
            className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 transition-colors px-2 py-1 w-1/4"
            onClick={() => navigate("/login")}
          >
            <FaUser className="text-xl mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

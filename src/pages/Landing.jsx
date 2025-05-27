import React from "react";
import { FaLeaf, FaHistory, FaMapMarkedAlt, FaCamera, FaUser, FaHeartbeat, FaRecycle, FaCommentDots } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Motion Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const fadeIn = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const zoomIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 10
    }
  }
};

const features = [
  {
    icon: <FaRecycle className="text-emerald-500 text-3xl mb-2" />,
    title: "AI Sustainability Score",
    desc: "Understand your product's eco impact",
    img: (
      <div className="w-full h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center text-emerald-500 font-bold">
        🌍 Eco Rating
      </div>
    )
  },
  {
    icon: <FaHeartbeat className="text-rose-500 text-3xl mb-2" />,
    title: "Health Checker",
    desc: "Analyze ingredients against your health conditions",
    img: (
      <div className="w-full h-24 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg flex items-center justify-center text-rose-500 font-bold">
        ❤️ Health Scan
      </div>
    )
  },
  {
    icon: <FaMapMarkedAlt className="text-blue-500 text-3xl mb-2" />,
    title: "Sustainability Map",
    desc: "Discover awesome eco-friendly stores near you",
    img: (
      <div className="w-full h-24 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center text-blue-500 font-bold">
        🗺️ Local Guide
      </div>
    )
  },
  {
    icon: <FaHistory className="text-amber-500 text-3xl mb-2" />,
    title: "History Log",
    desc: "Track your past scans and improvements",
    img: (
      <div className="w-full h-24 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg flex items-center justify-center text-amber-500 font-bold">
        📊 Your Progress
      </div>
    )
  }
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-sans flex flex-col relative">
      {/* Fixed Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-lg shadow-sm fixed top-0 left-0 z-50 border-b border-emerald-100"
      >
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full p-2">
            <img src="./favicon.ico" alt="Logo" className="w-8 h-8 rounded-full bg-white shadow" />
          </div>
          <span className="text-emerald-800 text-xl font-bold">SustainedAway</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-6">
          {[].map((item) => (
            <motion.a 
              key={item}
              whileHover={{ scale: 1.05 }}
              href={`#${item.toLowerCase()}`}
              className="text-emerald-700 font-medium text-sm"
            >
              {item}
            </motion.a>
          ))}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full px-4 py-1 text-sm font-medium shadow-md border border-emerald-600 hover:from-teal-500 hover:to-emerald-500"
            onClick={() => navigate('/login')}
          >
            Login
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full px-4 py-1 text-sm font-medium shadow-md hover:from-teal-500 hover:to-emerald-500"
            onClick={() => navigate('/login', { state: { register: true } })}
          >
            Sign Up
          </motion.button>
        </div>
      </motion.nav>
      {/* Spacer for fixed navbar */}
      <div className="h-16 md:h-20 w-full" />
      {/* Main Content (with extra bottom padding for mobile nav) */}
      <main className="flex-1 pt-0 pb-24 md:pb-20 w-full overflow-x-hidden">
        {/* Hero Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="w-full px-6 py-12 md:py-24 max-w-6xl mx-auto"
        >
          <motion.div 
            variants={fadeIn}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-emerald-900 mb-6">
              Track. Rate. <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Live Sustainably.</span>
            </h1>
            <p className="text-lg md:text-xl text-emerald-700 mb-8 max-w-2xl mx-auto">
              Scan products and bills to discover their sustainability scores.
              Make better choices for your health and the planet.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:from-teal-500 hover:to-emerald-500 hover:shadow-emerald-200 transition"
              onClick={() => navigate('/login')}
            >
              Get Started – It's Free 🌱
            </motion.button>
          </motion.div>

          <motion.div 
            variants={zoomIn}
            className="bg-white rounded-2xl shadow-2xl p-6 border border-emerald-200 max-w-3xl mx-auto flex items-center justify-center"
          >
            <div className="w-full h-64 bg-white rounded-xl flex items-center justify-center shadow-inner border border-emerald-100">
              <div className="text-center">
                <FaCamera className="text-emerald-600 text-5xl mx-auto mb-4 drop-shadow-lg" />
                <p className="text-emerald-800 font-bold text-lg">Product Scanner Preview</p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="w-full px-6 py-16 bg-white/30"
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              variants={fadeIn}
              className="text-3xl md:text-4xl font-bold text-center text-emerald-900 mb-12"
            >
              Our Powerful Features
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={fadeIn}
                  whileHover={{ scale: 1.07, y: -8, boxShadow: "0 8px 32px 0 rgba(34,197,94,0.18)" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden border-t-4 border-emerald-500 p-5 transition-colors duration-200 hover:bg-emerald-50 cursor-pointer group"
                  tabIndex={0}
                  aria-label={feature.title}
                >
                  <motion.div 
                    whileHover={{ rotate: [0, 8, -8, 0], scale: 1.15 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    className="inline-block mb-2"
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-emerald-700 transition-colors duration-200">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 group-hover:text-emerald-800 transition-colors duration-200">{feature.desc}</p>
                  {feature.img}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Map Section */}
        <section id="map" className="w-full px-6 py-16 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-6">
                <div className="h-64 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FaMapMarkedAlt className="text-blue-500 text-4xl mx-auto mb-4" />
                    <p className="text-blue-600 font-medium">Interactive Sustainability Map</p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Find Eco-Friendly Stores</h3>
                <p className="text-gray-600 mb-6">
                  Our map highlights sustainable businesses with green markers and 
                  less sustainable ones with red markers. Make conscious choices wherever you go.
                </p>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="self-start bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-full shadow-md hover:from-cyan-500 hover:to-blue-500"
                >
                  Explore Map
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section id="feedback" className="w-full px-6 py-16 max-w-4xl mx-auto">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-8 text-center"
          >
            <FaCommentDots className="text-white text-4xl mx-auto mb-4" />
            <h3 className="text-white text-2xl font-bold mb-2">SustainaVoice 💬</h3>
            <p className="text-emerald-100 mb-6">
              Your feedback helps us improve and grow our sustainability database. 
              Share your insights to make a real difference.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold px-8 py-2 rounded-full shadow-lg hover:from-cyan-500 hover:to-blue-500"
            >
              Share Feedback
            </motion.button>
          </motion.div>
        </section>
      </main>
      {/* Mobile Bottom Nav */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg shadow-lg flex justify-around items-center py-3 z-40 border-t border-emerald-100"
      >
        {[
          { icon: <FaLeaf />, label: "Home" },
          { icon: <FaCamera />, label: "Scan" },
          { icon: <FaHistory />, label: "History" },
          { icon: <FaMapMarkedAlt />, label: "Map" },
          { icon: <FaUser />, label: "Profile" }
        ].map((item, index) => (
          <motion.a 
            key={index}
            whileTap={{ scale: 0.9 }}
            href={`#${item.label.toLowerCase()}`}
            className="flex flex-col items-center text-emerald-700 text-xs"
          >
            <div className="text-xl mb-1">{item.icon}</div>
            {item.label}
          </motion.a>
        ))}
      </motion.nav>
    </div>
  );
}
import React from "react";

const Loader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
    <div className="px-8 py-6 rounded-2xl bg-white/30 border border-white/40 shadow-xl flex flex-col items-center">
      <div className="flex space-x-2">
        <span className="w-3 h-3 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s] shadow-lg" />
        <span className="w-3 h-3 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s] shadow-lg" />
        <span className="w-3 h-3 bg-green-300 rounded-full animate-bounce shadow-lg" />
      </div>
      <span className="mt-4 text-green-700 font-semibold tracking-wide text-sm" style={{fontFamily: 'SF Pro, San Francisco, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'}}>Loading...</span>
    </div>
  </div>
);

export default Loader; 
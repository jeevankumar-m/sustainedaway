import React from "react";
import { FaLeaf, FaRecycle, FaGlobeAmericas, FaSun, FaWater, FaTree, FaSeedling, FaCloudSun } from "react-icons/fa";

const icons = [
  { icon: FaLeaf, style: "top-8 left-4 text-green-400" },
  { icon: FaRecycle, style: "top-1/2 left-2 text-green-600" },
  { icon: FaGlobeAmericas, style: "top-10 right-8 text-green-300" },
  { icon: FaSun, style: "bottom-8 left-10 text-yellow-300" },
  { icon: FaWater, style: "bottom-16 right-8 text-blue-300" },
  { icon: FaTree, style: "top-1/3 right-2 text-green-500" },
  { icon: FaSeedling, style: "bottom-1/4 left-1/4 text-green-400" },
  { icon: FaCloudSun, style: "top-1/4 right-1/3 text-yellow-200" },
];

const BackgroundIcons = () => (
  <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
    {icons.map(({ icon: Icon, style }, i) => (
      <Icon
        key={i}
        className={`absolute ${style} opacity-10 text-[80px] md:text-[120px] select-none`}
        aria-hidden="true"
      />
    ))}
  </div>
);

export default BackgroundIcons; 
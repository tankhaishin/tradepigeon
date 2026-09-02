import React, { useState, useEffect } from 'react';
import { soundFx } from '../utils/audioEngine';

/**
 * Interactive WhitePigeonMascot Component
 * 
 * Clean, minimalist, and interactive 3D vector pigeon.
 * - No permanent text badge clutter.
 * - Clickable: plays sound fx, triggers Wing Flap + Bounce + Temporary Coo Speech Bubble!
 * - Hoverable: interactive Wing Flap motion & scale elevation.
 */
export default function WhitePigeonMascot({ 
  className = "w-20 h-20"
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const cooQuotes = [
    "Coo! 🕊️",
    "Stay disciplined!",
    "Follow your playbook 📜",
    "Don't FOMO in! 🛡️",
    "Coo coo! +10 DP",
    "Mindset check first!"
  ];

  const handleClick = (e) => {
    e.stopPropagation();
    soundFx.playPop();
    setIsAnimating(true);
    
    // Pick random coo quote
    const randomQuote = cooQuotes[Math.floor(Math.random() * cooQuotes.length)];
    setActiveSpeech(randomQuote);

    setTimeout(() => setIsAnimating(false), 600);
    setTimeout(() => setActiveSpeech(null), 2500);
  };

  return (
    <div 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex flex-col items-center group cursor-pointer transition-transform duration-300 ${
        isHovered ? 'scale-110 z-40' : 'z-20'
      } ${isAnimating ? 'animate-bounce' : ''}`}
    >
      {/* Temporary Interactive Speech Bubble on Click */}
      {activeSpeech && (
        <div className="absolute -top-10 px-3 py-1 bg-[#182830] border-2 border-[#1CB0F6] rounded-2xl text-[11px] font-black text-white shadow-2xl whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md animate-fade-in z-50">
          <span>{activeSpeech}</span>
          {/* Badge Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#182830] border-r-2 border-b-2 border-[#1CB0F6] rotate-45" />
        </div>
      )}

      {/* DUOLINGO 3D STRUCTURAL MESH VECTOR SVG */}
      <div className={`relative ${className}`}>
        <svg
          viewBox="0 0 240 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
        >
          <defs>
            {/* 3D Body Gradient (Duolingo Slate White) */}
            <linearGradient id="whitePigeonBody" x1="120" y1="40" x2="120" y2="210" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* 3D Face Gradient */}
            <linearGradient id="whitePigeonFace" x1="120" y1="75" x2="120" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* 3D Beak Gradient (Peach / Salmon) */}
            <linearGradient id="whitePigeonBeak" x1="120" y1="100" x2="120" y2="155" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFC2AD" />
              <stop offset="100%" stopColor="#FF835C" />
            </linearGradient>

            {/* 3D Wing Gradient */}
            <linearGradient id="whitePigeonWing" x1="0" y1="0" x2="0" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            <filter id="pigeonSoftShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#0A1014" floodOpacity="0.4" />
            </filter>

            <filter id="pigeonBeakShadow">
              <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" floodColor="#993D1E" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* 1. GROUND FEET */}
          <g filter="url(#pigeonSoftShadow)">
            <g className={isHovered ? "translate-y-[-2px]" : ""}>
              <ellipse cx="90" cy="228" rx="28" ry="9" fill="#0D161B" opacity="0.4" />
              <ellipse cx="90" cy="224" rx="22" ry="7" fill="#FFB79D" stroke="#E25C38" strokeWidth="2" />
            </g>

            <g className={isHovered ? "translate-y-[-2px]" : ""}>
              <ellipse cx="150" cy="228" rx="28" ry="9" fill="#0D161B" opacity="0.4" />
              <ellipse cx="150" cy="224" rx="22" ry="7" fill="#FFB79D" stroke="#E25C38" strokeWidth="2" />
            </g>
          </g>

          {/* 2. MAIN BODY GROUP */}
          <g filter="url(#pigeonSoftShadow)">
            {/* Main Torso */}
            <path
              d="M 60 110 C 60 70 85 45 120 45 C 155 45 180 70 180 110 C 180 160 165 210 120 210 C 75 210 60 160 60 110 Z"
              fill="url(#whitePigeonBody)"
              stroke="#64748B"
              strokeWidth="4.5"
            />

            {/* Belly Patch */}
            <path
              d="M 75 120 C 75 90 95 75 120 75 C 145 75 165 90 165 120 C 165 155 150 195 120 195 C 90 195 75 155 75 120 Z"
              fill="url(#whitePigeonFace)"
              stroke="#94A3B8"
              strokeWidth="2"
            />

            {/* INTERACTIVE LEFT WING (FLAPS OUTWARD FROM SHOULDER JOINT) */}
            <g 
              style={{ transformOrigin: '55px 110px' }} 
              className={`transition-transform duration-300 ${isHovered || isAnimating ? 'rotate-[-35deg]' : 'rotate-0'}`} 
              transform="translate(38, 100) rotate(-5)"
            >
              <path
                d="M 25 10 C 5 25 0 50 10 70 C 20 85 40 75 42 55 C 44 35 38 18 25 10 Z"
                fill="url(#whitePigeonWing)"
                stroke="#64748B"
                strokeWidth="4"
              />
              <path d="M 18 28 C 10 40 8 58 16 68" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* INTERACTIVE RIGHT WING (FLAPS OUTWARD FROM SHOULDER JOINT) */}
            <g 
              style={{ transformOrigin: '185px 110px' }} 
              className={`transition-transform duration-300 ${isHovered || isAnimating ? 'rotate-[35deg]' : 'rotate-0'}`} 
              transform="translate(162, 100) rotate(5)"
            >
              <path
                d="M 17 10 C 37 25 42 50 32 70 C 22 85 2 75 0 55 C -2 35 4 18 17 10 Z"
                fill="url(#whitePigeonWing)"
                stroke="#64748B"
                strokeWidth="4"
              />
              <path d="M 24 28 C 32 40 34 58 26 68" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* FEATHER CREST TOP */}
            <g className={`transition-transform duration-300 ${isHovered ? 'rotate-6 origin-[120px_47px]' : ''}`}>
              <path
                d="M 120 47 Q 105 20 95 28 Q 110 38 118 47 Z"
                fill="#F8FAFC"
                stroke="#64748B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <path
                d="M 122 47 Q 137 20 147 28 Q 132 38 124 47 Z"
                fill="#E2E8F0"
                stroke="#64748B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </g>

            {/* BEAK */}
            <g filter="url(#pigeonBeakShadow)">
              <path
                d="M 104 120 C 104 120 112 110 120 110 C 128 110 136 120 136 120 C 136 120 128 152 120 152 C 112 152 104 120 104 120 Z"
                fill="url(#whitePigeonBeak)"
                stroke="#E25C38"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M 108 120 Q 120 124 132 120"
                stroke="#E25C38"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* CUTE HUGE DUOLINGO EYES */}
            <g>
              <circle cx="92" cy="98" r="19" fill="#FFFFFF" stroke="#64748B" strokeWidth="3" />
              <circle cx="92" cy="98" r="11.5" fill="#0F172A" className={isHovered ? "scale-110 origin-[92px_98px]" : ""} />
              <circle cx="88" cy="93" r="4.5" fill="#FFFFFF" />
              <circle cx="96" cy="102" r="2.2" fill="#FFFFFF" />

              <circle cx="148" cy="98" r="19" fill="#FFFFFF" stroke="#64748B" strokeWidth="3" />
              <circle cx="148" cy="98" r="11.5" fill="#0F172A" className={isHovered ? "scale-110 origin-[148px_98px]" : ""} />
              <circle cx="144" cy="93" r="4.5" fill="#FFFFFF" />
              <circle cx="152" cy="102" r="2.2" fill="#FFFFFF" />
            </g>

            {/* CHEEK BLUSH */}
            <ellipse cx="74" cy="116" rx="6" ry="3.5" fill="rgba(255, 131, 92, 0.45)" />
            <ellipse cx="166" cy="116" rx="6" ry="3.5" fill="rgba(255, 131, 92, 0.45)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

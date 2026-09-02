import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../utils/audioEngine';

/**
 * 20 Unique Poses InteractiveParrotMascot Component
 * 
 * Master List of 20 Distinct Poses:
 * 1. 'neutral': Default calm standing pose with subtle breathing & eye tracking.
 * 2. 'welcoming': High wing raised upwards waving hello (high-five angle).
 * 3. 'calculating': Analytical pose with 3D glasses & glowing tech grid.
 * 4. 'pointing': Extended wing pointing directly at right content.
 * 5. 'happy': High-energy dance with open wings and gold sparkles.
 * 6. 'thinking': Tilt head with 3D glasses + floating idea lightbulb.
 * 7. 'anxious': Nervous shivering pupils, wide open eyes + blue sweat drop.
 * 8. 'revenge': Angry fire glow eyes, tilted angry brow, steam rising + red aura.
 * 9. 'tired': Half-closed droopy eyes, low slouched posture + floating Zzzs.
 * 10. 'celebrating': Full victorious dance party with green/gold sparkles!
 * 11. 'reading': Holding a mini strategy book with reading glasses.
 * 12. 'shielded': Holding a gold 3D discipline armor shield in front.
 * 13. 'shocked': Super wide eyes, mouth open beak, floating question mark.
 * 14. 'sleeping': Completely closed eyes with floating big ZZZ bubble.
 * 15. 'flexing': Raised dual wings flexing discipline muscle strength.
 * 16. 'meditating': Floating zen pose with glowing halo ring above head.
 * 17. 'whistling': Pucked beak tune note floating out.
 * 18. 'saluting': Right wing up in military disciplined salute.
 * 19. 'trophy': Holding up a gold victory trophy cup.
 * 20. 'lockdown': Locked padlock around chest with key icon.
 */
export default function InteractiveParrotMascot({ pose = 'neutral', className = "w-36 h-36" }) {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const mascotRef = useRef(null);

  const handleMascotClick = () => {
    soundFx.playPop();
  };

  const isDancing = pose === 'celebrating' || pose === 'happy';

  // Mouse Tracking Effect (Clamped to max 6px offset)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance === 0) return;

      const maxOffset = 6;
      const clampX = Math.max(-maxOffset, Math.min(maxOffset, (deltaX / distance) * maxOffset));
      const clampY = Math.max(-maxOffset, Math.min(maxOffset, (deltaY / distance) * maxOffset));

      setPupilOffset({ x: clampX, y: clampY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Random Blink Timer
  useEffect(() => {
    if (pose === 'tired' || pose === 'sleeping') return;
    let timeoutId;
    const scheduleBlink = () => {
      const randomDelay = Math.floor(Math.random() * 2000) + 3000;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 120);
      }, randomDelay);
    };

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [pose]);

  return (
    <div 
      ref={mascotRef} 
      onClick={handleMascotClick}
      className={`relative flex items-center justify-center select-none cursor-pointer duo-mascot-float transition-transform hover:scale-105 active:scale-95 ${className}`}
    >
      <style>{`
        /* --- DANCE KEYFRAMES --- */
        @keyframes parrotDanceBounce {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          25% { transform: translateY(-8px) rotate(0deg); }
          50% { transform: translateY(0px) rotate(4deg); }
          75% { transform: translateY(-8px) rotate(0deg); }
        }
        .animate-dance-body {
          transform-origin: 120px 220px;
          animation: parrotDanceBounce 0.8s cubic-bezier(0.36, 0, 0.66, -0.56) infinite;
        }

        @keyframes leftWingDance {
          0%, 100% { transform: rotate(-55deg) translateY(0px); }
          50% { transform: rotate(-20deg) translateY(-6px); }
        }
        .animate-left-wing-dance {
          transform-origin: 52px 118px;
          animation: leftWingDance 0.4s ease-in-out infinite alternate;
        }

        @keyframes rightWingDance {
          0%, 100% { transform: rotate(20deg) translateY(-6px); }
          50% { transform: rotate(55deg) translateY(0px); }
        }
        .animate-right-wing-dance {
          transform-origin: 188px 118px;
          animation: rightWingDance 0.4s ease-in-out infinite alternate;
        }

        /* --- GENTLE NATURAL RAISED HAND WAVE (Friendly Hello Wave) --- */
        @keyframes rightWingNaturalWave {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(-18deg) translateY(-4px); }
        }
        .animate-wing-wave-upward {
          transform-origin: 185px 110px;
          animation: rightWingNaturalWave 0.7s ease-in-out infinite alternate;
        }

        /* --- POINTING WING KEYFRAME --- */
        @keyframes rightWingPoint {
          0%, 100% { transform: rotate(65deg) scaleX(1.15); }
          50% { transform: rotate(55deg) scaleX(1.1); }
        }
        .animate-wing-point {
          transform-origin: 188px 118px;
          animation: rightWingPoint 1.5s ease-in-out infinite alternate;
        }

        /* --- SALUTE KEYFRAME --- */
        @keyframes rightWingSalute {
          0%, 100% { transform: rotate(-135deg) translateX(-15px); }
          50% { transform: rotate(-130deg) translateX(-15px); }
        }
        .animate-wing-salute {
          transform-origin: 188px 118px;
          animation: rightWingSalute 1.8s ease-in-out infinite alternate;
        }

        /* --- SMOOTH 3D FLIGHT HOVER & WING FLAP KEYFRAMES --- */
        @keyframes parrotFlightHover {
          0%, 100% { transform: translateY(-16px) rotate(-2deg); }
          50% { transform: translateY(-28px) rotate(2deg); }
        }
        .animate-flying-body {
          transform-origin: 120px 180px;
          animation: parrotFlightHover 1.8s ease-in-out infinite;
        }

        @keyframes leftWingFlyFlap {
          0%, 100% { transform: rotate(-65deg) scaleY(1.1); }
          50% { transform: rotate(15deg) scaleY(0.9); }
        }
        .animate-left-wing-fly {
          transform-origin: 52px 118px;
          animation: leftWingFlyFlap 0.28s ease-in-out infinite alternate;
        }

        @keyframes rightWingFlyFlap {
          0%, 100% { transform: rotate(65deg) scaleY(1.1); }
          50% { transform: rotate(-15deg) scaleY(0.9); }
        }
        .animate-right-wing-fly {
          transform-origin: 188px 118px;
          animation: rightWingFlyFlap 0.28s ease-in-out infinite alternate;
        }

        /* --- ZEN MEDITATING FLOAT --- */
        @keyframes zenFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-zen-float {
          animation: zenFloat 3s ease-in-out infinite;
        }

        @keyframes leftFootTap {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(-8deg); }
        }
        .animate-left-foot-dance {
          transform-origin: 90px 224px;
          animation: leftFootTap 0.4s ease-in-out infinite;
        }

        @keyframes rightFootTap {
          0%, 100% { transform: translateY(-7px) rotate(8deg); }
          50% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-right-foot-dance {
          transform-origin: 150px 224px;
          animation: rightFootTap 0.4s ease-in-out infinite;
        }

        @keyframes hairGroove {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
        .animate-hair-groove {
          transform-origin: 120px 60px;
          animation: hairGroove 0.4s ease-in-out infinite alternate;
        }

        /* --- REVENGE SHAKE KEYFRAME --- */
        @keyframes revengeRageShake {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          20% { transform: translate(-2px, 1px) rotate(-2deg); }
          40% { transform: translate(2px, -1px) rotate(2deg); }
          60% { transform: translate(-1px, -2px) rotate(-1deg); }
          80% { transform: translate(1px, 2px) rotate(1deg); }
        }
        .animate-revenge-shake {
          animation: revengeRageShake 0.15s ease-in-out infinite;
        }

        /* --- 100% SYNCHRONIZED 1-TO-1 SINGLE HOP + MID-AIR FLOAT + DESCENT WING OPEN --- */
        @keyframes singleHopBody {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          18% { transform: translateY(3px) scaleY(0.95); }        /* 1. Squat Pre-Bend */
          42% { transform: translateY(-22px) scaleY(1.05); }     /* 2. Rising Launch */
          65% { transform: translateY(-20px) scaleY(1.02); }     /* 3. Mid-Air Float Apex */
          85% { transform: translateY(1px) scaleY(0.97); }        /* 4. Touchdown Cushion */
        }
        .animate-single-hop-body {
          transform-origin: 120px 180px;
          animation: singleHopBody 1.4s ease-in-out infinite;
        }

        @keyframes singleHopFeet {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          18% { transform: translateY(2px) scaleY(0.95); }        /* 1. Squat Pre-Bend */
          42% { transform: translateY(-12px) scaleY(0.92); }     /* 2. Rising Launch (Legs Lift) */
          65% { transform: translateY(-10px) scaleY(0.94); }     /* 3. Mid-Air Float Apex */
          85% { transform: translateY(0px) scaleY(1.02); }        /* 4. Touchdown Cushion */
        }
        .animate-single-hop-feet {
          transform-origin: 120px 224px;
          animation: singleHopFeet 1.4s ease-in-out infinite;
        }

        /* WINGS OPEN OUTWARDS & STAY OPENED DURING DESCENT (DELAYED FOLD ON TOUCHDOWN) */
        @keyframes leftWingDescentOpen {
          0%, 35% { transform: rotate(0deg) translateX(0px); }
          58% { transform: rotate(26deg) translateX(-9px); }   /* Open up smoothly */
          85% { transform: rotate(22deg) translateX(-7px); }   /* STAY OPENED THROUGH DESCENT (DELAYED) */
          96%, 100% { transform: rotate(0deg) translateX(0px); } /* Fold back gently on ground rest */
        }
        .animate-left-wing-descent {
          transform-origin: 52px 118px;
          animation: leftWingDescentOpen 1.4s ease-in-out infinite;
        }

        @keyframes rightWingDescentOpen {
          0%, 35% { transform: rotate(0deg) translateX(0px); }
          58% { transform: rotate(-26deg) translateX(9px); }   /* Open up smoothly */
          85% { transform: rotate(-22deg) translateX(7px); }   /* STAY OPENED THROUGH DESCENT (DELAYED) */
          96%, 100% { transform: rotate(0deg) translateX(0px); } /* Fold back gently on ground rest */
        }
        .animate-right-wing-descent {
          transform-origin: 188px 118px;
          animation: rightWingDescentOpen 1.4s ease-in-out infinite;
        }

        /* --- TIRED SNOOZE FLOAT KEYFRAME --- */
        @keyframes zzzFloat {
          0% { transform: translate(0px, 0px) scale(0.6); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(15px, -25px) scale(1.2); opacity: 0; }
        }
        .animate-zzz-1 { animation: zzzFloat 2.5s ease-in-out infinite; }
        .animate-zzz-2 { animation: zzzFloat 2.5s ease-in-out infinite 0.8s; }

        /* --- IDLE KEYFRAMES --- */
        @keyframes hairSway {
          0%, 100% { transform: rotate(-7deg); }
          50% { transform: rotate(7deg); }
        }
        .animate-hair-sway {
          transform-origin: 120px 60px;
          animation: hairSway 2.4s ease-in-out infinite;
        }

        @keyframes leftWingFlap {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-14deg); }
        }
        .animate-left-wing {
          transform-origin: 52px 118px;
          animation: leftWingFlap 3.2s ease-in-out infinite;
        }

        @keyframes rightWingFlap {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }
        .animate-right-wing {
          transform-origin: 188px 118px;
          animation: rightWingFlap 3.8s ease-in-out infinite;
        }

        @keyframes feetTap {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3.5px); }
        }
        .animate-feet-tap {
          transform-origin: 120px 225px;
          animation: feetTap 4.2s ease-in-out infinite;
        }

        @keyframes chestBreathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.05); }
        }
        .animate-chest-breathe {
          transform-origin: 120px 180px;
          animation: chestBreathe 2.8s ease-in-out infinite;
        }

        @keyframes headBob {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-head-bob {
          transform-origin: 120px 120px;
          animation: headBob 5.5s ease-in-out infinite;
        }
      `}</style>

      <svg
        key={pose}
        viewBox="0 0 240 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full overflow-visible ${
          pose === 'revenge' ? 'animate-revenge-shake' : 
          pose === 'meditating' ? 'animate-zen-float' : ''
        }`}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="120" y1="40" x2="120" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={pose === 'revenge' ? "#FF2200" : "#FF7700"} />
            <stop offset="60%" stopColor={pose === 'revenge' ? "#CC0000" : "#FF5500"} />
            <stop offset="100%" stopColor={pose === 'revenge' ? "#990000" : "#D93B00"} />
          </linearGradient>

          <linearGradient id="faceGrad" x1="120" y1="75" x2="120" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={pose === 'revenge' ? "#FF5533" : "#FFAA33"} />
            <stop offset="100%" stopColor={pose === 'revenge' ? "#DD2200" : "#FF7700"} />
          </linearGradient>

          <linearGradient id="beakGrad" x1="120" y1="100" x2="120" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7D6" />
            <stop offset="100%" stopColor="#FFE082" />
          </linearGradient>

          <linearGradient id="wingGrad" x1="0" y1="0" x2="0" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E54D00" />
            <stop offset="100%" stopColor="#B33000" />
          </linearGradient>

          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#0A1014" floodOpacity="0.3" />
          </filter>

          <filter id="beakShadow">
            <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" floodColor="#997000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. GROUND FEET (Hidden during flight for true aerodynamic mid-air feel) */}
        {pose !== 'flying' && (
          <g filter="url(#softShadow)">
            <g className={
              isDancing ? "animate-left-foot-dance" : 
              pose === 'map_perched' ? "animate-single-hop-feet" : 
              "animate-feet-tap"
            }>
              <ellipse cx="90" cy="228" rx="28" ry="9" fill="#0D161B" opacity="0.4" />
              <ellipse cx="90" cy="224" rx="22" ry="7" fill="#FFE082" stroke="#D9A000" strokeWidth="2" />
            </g>

            <g className={
              isDancing ? "animate-right-foot-dance" : 
              pose === 'map_perched' ? "animate-single-hop-feet" : 
              "animate-feet-tap"
            }>
              <ellipse cx="150" cy="228" rx="28" ry="9" fill="#0D161B" opacity="0.4" />
              <ellipse cx="150" cy="224" rx="22" ry="7" fill="#FFE082" stroke="#D9A000" strokeWidth="2" />
            </g>
          </g>
        )}

        {/* 2. MAIN BODY GROUP */}
        <g className={
          isDancing ? "animate-dance-body" : 
          pose === 'flying' ? "animate-flying-body" : 
          pose === 'map_perched' ? "animate-natural-hop-body" : 
          "animate-head-bob"
        }>
          {/* Tucked Flight Feet (Tucked cutely up against belly mid-air) */}
          {pose === 'flying' && (
            <g filter="url(#softShadow)" className="animate-feet-tap">
              <ellipse cx="98" cy="198" rx="14" ry="7" fill="#FFE082" stroke="#D9A000" strokeWidth="2" />
              <ellipse cx="142" cy="198" rx="14" ry="7" fill="#FFE082" stroke="#D9A000" strokeWidth="2" />
            </g>
          )}

          {/* Crown Feather Hair */}
          <g filter="url(#softShadow)" className={isDancing ? "animate-hair-groove" : "animate-hair-sway"}>
            <path d="M120 60 C95 40, 85 15, 110 8 C125 25, 125 40, 120 60 Z" fill={pose === 'revenge' ? "#CC0000" : "#FF4400"} />
            <path d="M120 60 C115 35, 115 8, 140 2 C145 22, 138 42, 120 60 Z" fill={pose === 'revenge' ? "#FF2200" : "#FF6600"} />
            <path d="M120 60 C132 35, 145 15, 162 18 C155 35, 142 48, 120 60 Z" fill={pose === 'revenge' ? "#FF4400" : "#FF8800"} />
          </g>

          {/* Canonical Round Mascot Body (Consistent Silhouette across ALL poses!) */}
          <g filter="url(#softShadow)">
            <rect x="50" y="55" width="140" height="155" rx="65" fill="url(#bodyGrad)" stroke="#B33000" strokeWidth="4" className={isDancing ? "" : "animate-chest-breathe"} />
            <path d="M75 68 C95 58, 145 58, 165 68 C145 62, 95 62, 75 68 Z" fill="#FFFFFF" opacity="0.4" />
          </g>

          {/* Canonical Face Mask */}
          <path 
            d="M65 125 C65 85, 85 78, 120 78 C155 78, 175 85, 175 125 C175 165, 155 190, 120 190 C85 190, 65 165, 65 125 Z" 
            fill="url(#faceGrad)" 
          />

          {/* Left Wing */}
          <g filter="url(#softShadow)" className={
            isDancing ? "animate-left-wing-dance" : 
            pose === 'flying' ? "animate-left-wing-fly" : 
            pose === 'flexing' ? "animate-wing-wave-upward" : 
            pose === 'map_perched' ? "animate-left-wing-descent" : 
            "animate-left-wing"
          }>
            {pose === 'flying' ? (
              /* Custom Wide Horizontal Flight Wing Path (Left) */
              <g>
                <path d="M55 125 C15 110, -10 135, 15 160 C38 155, 48 140, 55 125 Z" fill="url(#wingGrad)" stroke="#992600" strokeWidth="3" />
                <path d="M50 132 C20 120, 5 140, 22 155 C38 148, 45 138, 50 132 Z" fill="#FF6600" opacity="0.6" />
              </g>
            ) : (
              /* Default Rest/Flap Wing Path */
              <g>
                <path d="M52 118 C30 130, 22 165, 46 190 C58 172, 58 142, 52 118 Z" fill="url(#wingGrad)" stroke="#992600" strokeWidth="3" />
                <path d="M48 128 C34 140, 32 160, 44 178 C48 165, 48 145, 48 128 Z" fill="#FF6600" opacity="0.6" />
              </g>
            )}
          </g>

          {/* Right Wing */}
          <g filter="url(#softShadow)" className={
            isDancing ? "animate-right-wing-dance" : 
            pose === 'flying' ? "animate-right-wing-fly" : 
            pose === 'welcoming' ? "animate-wing-wave-upward" : 
            pose === 'pointing' ? "animate-wing-point" : 
            pose === 'saluting' ? "animate-wing-salute" : 
            pose === 'flexing' ? "animate-wing-wave-upward" : 
            pose === 'map_perched' ? "animate-right-wing-descent" : 
            "animate-right-wing"
          }>
            {pose === 'welcoming' ? (
              /* Custom Raised Waving Hand/Wing Path */
              <g>
                <path d="M185 110 C215 90, 225 65, 205 55 C190 75, 185 95, 185 110 Z" fill="url(#wingGrad)" stroke="#992600" strokeWidth="3" />
                <path d="M190 100 C210 82, 218 62, 202 56 C192 72, 190 88, 190 100 Z" fill="#FF6600" opacity="0.6" />
              </g>
            ) : pose === 'flying' ? (
              /* Custom Wide Horizontal Flight Wing Path (Right) */
              <g>
                <path d="M185 125 C225 110, 250 135, 225 160 C202 155, 192 140, 185 125 Z" fill="url(#wingGrad)" stroke="#992600" strokeWidth="3" />
                <path d="M190 132 C220 120, 235 140, 218 155 C202 148, 195 138, 190 132 Z" fill="#FF6600" opacity="0.6" />
              </g>
            ) : (
              /* Default Rest/Flap Wing Path */
              <g>
                <path d="M188 118 C210 130, 218 165, 194 190 C182 172, 182 142, 188 118 Z" fill="url(#wingGrad)" stroke="#992600" strokeWidth="3" />
                <path d="M192 128 C206 140, 208 160, 196 178 C192 165, 192 145, 192 128 Z" fill="#FF6600" opacity="0.6" />
              </g>
            )}
          </g>

          {/* Beak */}
          <g filter="url(#beakShadow)">
            {pose === 'flying' || isDancing ? (
              /* Open Happy Beak Vector */
              <g>
                <path d="M102 108 C102 108, 120 102, 138 108 C142 126, 120 142, 120 142 C120 142, 98 126, 102 108 Z" fill="url(#beakGrad)" stroke="#D9A000" strokeWidth="3" />
                <path d="M108 124 C112 138, 128 138, 132 124 Z" fill="#E53935" />
                <path d="M112 130 C116 138, 124 138, 128 130 Z" fill="#FF7043" />
              </g>
            ) : (
              /* Closed Standard Beak Vector */
              <g>
                <path d="M102 108 C102 108, 120 102, 138 108 C142 132, 120 156, 120 156 C120 156, 98 132, 102 108 Z" fill="url(#beakGrad)" stroke="#D9A000" strokeWidth="3" />
                <path d="M110 112 C115 110, 125 110, 130 112 C125 125, 120 135, 120 135 C118 128, 114 120, 110 112 Z" fill="#FFFFFF" opacity="0.45" />
              </g>
            )}
          </g>

          {/* --- DISTINCT EYES & FACIAL EXPRESSIONS PER POSE --- */}
          <g transform={`translate(${pupilOffset.x}, ${pupilOffset.y})`}>
            {/* 1. FLYING POSE: CANONICAL EYES WITH HAPPY OPEN SMILE */}
            {pose === 'flying' ? (
              <g>
                <g transform="translate(92, 104)">
                  <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#0D161B" strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="10" fill="#0D161B" />
                  <circle cx="-4" cy="-4" r="4" fill="#FFFFFF" />
                  <circle cx="3" cy="4" r="1.5" fill="#FFFFFF" />
                </g>
                <g transform="translate(148, 104)">
                  <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#0D161B" strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="10" fill="#0D161B" />
                  <circle cx="-4" cy="-4" r="4" fill="#FFFFFF" />
                  <circle cx="3" cy="4" r="1.5" fill="#FFFFFF" />
                </g>
              </g>
            ) : pose === 'tired' || pose === 'sleeping' ? (
              /* 2. TIRED / SLEEPING POSE */
              <g>
                <g transform="translate(92, 104)">
                  <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#0D161B" strokeWidth="2.5" />
                  <path d="M-16 -4 L16 -4 L16 16 L-16 16 Z" fill="#FF5500" />
                  <line x1="-14" y1="-4" x2="14" y2="-4" stroke="#0D161B" strokeWidth="3" />
                </g>
                <g transform="translate(148, 104)">
                  <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#0D161B" strokeWidth="2.5" />
                  <path d="M-16 -4 L16 -4 L16 16 L-16 16 Z" fill="#FF5500" />
                  <line x1="-14" y1="-4" x2="14" y2="-4" stroke="#0D161B" strokeWidth="3" />
                </g>
              </g>
            ) : pose === 'revenge' ? (
              /* REVENGE POSE */
              <g>
                <g transform="translate(92, 104)">
                  <circle cx="0" cy="0" r="16" fill="#FFF0F0" stroke="#990000" strokeWidth="3" />
                  <circle cx="0" cy="0" r="9" fill="#DC2626" />
                  <circle cx="0" cy="0" r="4" fill="#000000" />
                  <line x1="-18" y1="-16" x2="14" y2="-6" stroke="#0D161B" strokeWidth="4.5" strokeLinecap="round" />
                </g>
                <g transform="translate(148, 104)">
                  <circle cx="0" cy="0" r="16" fill="#FFF0F0" stroke="#990000" strokeWidth="3" />
                  <circle cx="0" cy="0" r="9" fill="#DC2626" />
                  <circle cx="0" cy="0" r="4" fill="#000000" />
                  <line x1="-14" y1="-6" x2="18" y2="-16" stroke="#0D161B" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              </g>
            ) : pose === 'shocked' ? (
              /* SHOCKED POSE: WIDE OPEN EYES */
              <g>
                <g transform="translate(92, 104)">
                  <circle cx="0" cy="0" r="18" fill="#FFFFFF" stroke="#0D161B" strokeWidth="3" />
                  <circle cx="0" cy="0" r="5" fill="#0D161B" />
                </g>
                <g transform="translate(148, 104)">
                  <circle cx="0" cy="0" r="18" fill="#FFFFFF" stroke="#0D161B" strokeWidth="3" />
                  <circle cx="0" cy="0" r="5" fill="#0D161B" />
                </g>
              </g>
            ) : (
              /* STANDARD EYES */
              <g>
                <g transform={`translate(92, 104) ${isBlinking ? 'scale(1, 0.08)' : 'scale(1, 1)'}`}>
                  <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#0D161B" strokeWidth="2.5" />
                  <circle cx={pose === 'anxious' ? -3 : 0} cy={pose === 'anxious' ? -3 : 0} r={pose === 'anxious' ? 7 : 10} fill="#0D161B" />
                  <circle cx="-4" cy="-4" r="4" fill="#FFFFFF" />
                  <circle cx="3" cy="4" r="1.5" fill="#FFFFFF" />
                </g>

                <g transform={`translate(148, 104) ${isBlinking ? 'scale(1, 0.08)' : 'scale(1, 1)'}`}>
                  <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#0D161B" strokeWidth="2.5" />
                  <circle cx={pose === 'anxious' ? 3 : 0} cy={pose === 'anxious' ? -3 : 0} r={pose === 'anxious' ? 7 : 10} fill="#0D161B" />
                  <circle cx="-4" cy="-4" r="4" fill="#FFFFFF" />
                  <circle cx="3" cy="4" r="1.5" fill="#FFFFFF" />
                </g>
              </g>
            )}
          </g>

          {/* --- POSE SPECIFIC UNIQUE OVERLAYS (20 VARIANTS) --- */}
          
          {/* 1. WELCOMING: Raised Upward Wing Wave & Sparkle */}
          {pose === 'welcoming' && (
            <g filter="url(#softShadow)">
              <path d="M210 20 L214 26 L220 28 L214 30 L210 36 L206 30 L200 28 L206 26 Z" fill="#FFC800" />
            </g>
          )}

          {/* 2. CALCULATING / THINKING */}
          {(pose === 'thinking' || pose === 'calculating') && (
            <g filter="url(#softShadow)">
              <circle cx="92" cy="104" r="20" fill="none" stroke="#1E293B" strokeWidth="4" />
              <circle cx="148" cy="104" r="20" fill="none" stroke="#1E293B" strokeWidth="4" />
              <line x1="112" y1="104" x2="128" y2="104" stroke="#1E293B" strokeWidth="4" />
              <circle cx="185" cy="35" r="14" fill="#FFD700" stroke="#FF9900" strokeWidth="3" />
              <path d="M178 35 L192 35 M185 28 L185 42" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* 3. POINTING: Hand/wing already custom-drawn pointing right */}

          {/* 4. READING: Strategy Book + Glasses */}
          {pose === 'reading' && (
            <g filter="url(#softShadow)">
              <rect x="90" y="160" width="60" height="40" rx="4" fill="#1CB0F6" stroke="#1899D6" strokeWidth="3" />
              <line x1="120" y1="160" x2="120" y2="200" stroke="#FFFFFF" strokeWidth="3" />
            </g>
          )}

          {/* 5. SHIELDED: Holding 3D Discipline Armor Shield (Positioned at chest, cyan/silver knight armor) */}
          {pose === 'shielded' && (
            <g filter="url(#softShadow)">
              {/* Outer Shield Body */}
              <path 
                d="M85 160 H155 V185 C155 210 120 225 120 225 C120 225 85 210 85 185 V160 Z" 
                fill="#1CB0F6" 
                stroke="#147BB0" 
                strokeWidth="4" 
              />
              {/* Inner Shield Rim */}
              <path 
                d="M93 166 H147 V183 C147 202 120 214 120 214 C120 214 93 202 93 183 V166 Z" 
                fill="none" 
                stroke="#70D4FF" 
                strokeWidth="2.5" 
              />
              {/* Center Discipline Checkmark Emblem */}
              <path 
                d="M108 185 L116 193 L134 175" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="4.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </g>
          )}

          {/* 6. SHOCKED: Floating Question Mark */}
          {pose === 'shocked' && (
            <g filter="url(#softShadow)">
              <text x="180" y="55" fill="#FF4B4B" className="text-3xl font-black">?</text>
            </g>
          )}

          {/* 7. MEDITATING: Zen Halo */}
          {pose === 'meditating' && (
            <g filter="url(#softShadow)">
              <ellipse cx="120" cy="25" rx="35" ry="8" fill="none" stroke="#FFD700" strokeWidth="4" />
            </g>
          )}

          {/* 8. WHISTLING: Music Note */}
          {pose === 'whistling' && (
            <g filter="url(#softShadow)">
              <path d="M175 80 L185 75 V90 M185 75 L195 70 V85" stroke="#1CB0F6" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* 9. TROPHY: Holding Gold Trophy */}
          {pose === 'trophy' && (
            <g filter="url(#softShadow)">
              <path d="M105 140 H135 V165 C135 175 120 180 120 180 C120 180 105 175 105 165 V140 Z" fill="#FFC800" stroke="#B8860B" strokeWidth="3" />
              <rect x="112" y="180" width="16" height="12" fill="#B8860B" />
            </g>
          )}

          {/* 10. LOCKDOWN: Chest Padlock */}
          {pose === 'lockdown' && (
            <g filter="url(#softShadow)">
              <rect x="105" y="150" width="30" height="25" rx="4" fill="#E5E5E5" stroke="#AFB5C0" strokeWidth="3" />
              <circle cx="120" cy="162" r="3" fill="#4B5563" />
            </g>
          )}

          {/* ANXIOUS */}
          {pose === 'anxious' && (
            <g>
              <path d="M182 75 C182 75, 190 88, 182 95 C176 95, 174 89, 182 75 Z" fill="#0EA5E9" stroke="#0284C7" strokeWidth="2" filter="url(#softShadow)" />
            </g>
          )}

          {/* REVENGE */}
          {pose === 'revenge' && (
            <g filter="url(#softShadow)">
              <path d="M70 25 C65 15, 75 10, 70 0" stroke="#FF4400" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M170 25 C165 15, 175 10, 170 0" stroke="#FF4400" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* TIRED / SLEEPING */}
          {(pose === 'tired' || pose === 'sleeping') && (
            <g className="text-[#38BDF8] font-black text-sm select-none">
              <text x="170" y="70" fill="#38BDF8" className="animate-zzz-1 text-lg font-black">Z</text>
              <text x="185" y="50" fill="#38BDF8" className="animate-zzz-2 text-xl font-black">Z</text>
            </g>
          )}

          {/* HAPPY / CELEBRATING */}
          {(pose === 'happy' || pose === 'celebrating') && (
            <g>
              <path d="M45 35 L49 42 L57 45 L49 48 L45 55 L41 48 L33 45 L41 42 Z" fill="#FFD700" filter="url(#softShadow)" />
              <path d="M195 40 L198 46 L204 48 L198 50 L195 56 L192 50 L186 48 L192 46 Z" fill="#58CC02" filter="url(#softShadow)" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

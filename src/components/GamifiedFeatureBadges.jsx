import React from 'react';

// 1. 3D Tactile Shield Badge (Green #58CC02)
export function Duo3dShieldBadge({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 44C33 40 40 32 40 20V8L24 3L8 8V20C8 32 15 40 24 44Z" fill="#3C8901"/>
      <path d="M24 41C31.5 37.5 37.5 30 37.5 19V9L24 4.5L10.5 9V19C10.5 30 16.5 37.5 24 41Z" fill="#58CC02"/>
      <path d="M24 8.5L34 12.2V19C34 27.5 29.5 33.5 24 36.5C18.5 33.5 14 27.5 14 19V12.2L24 8.5Z" fill="#79E824"/>
      <path d="M20.5 24.5L16.5 20.5L13.5 23.5L20.5 30.5L34.5 16.5L31.5 13.5L20.5 24.5Z" fill="white"/>
    </svg>
  );
}

// 2. 3D Tactile Flame Badge (Orange #FF6B00 & Gold)
export function Duo3dFlameBadge({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 44C36 44 42 36 42 26C42 16 32 8 26 2C24 10 18 14 18 20C18 20 12 16 12 10C6 18 6 26 6 32C6 40 14 44 26 44Z" fill="#C2410C"/>
      <path d="M25 41C34 41 39 34 39 25C39 15 30 7 25 1.5C23 9 17 13 17 19C17 19 12 15 12 9.5C6.5 17 6.5 24.5 6.5 30C6.5 37.5 14 41 25 41Z" fill="#FF6B00"/>
      <path d="M25 41C31 41 34 36 34 29C34 21 27 16 23 11C23 16 19 19 19 23C19 23 15 20 15 16C11 21 11 26 11 30C11 36 17 41 25 41Z" fill="#FF852C"/>
      <path d="M25 41C29 41 31 37 31 32C31 26 26 22 23 18C23 21 20 23 20 26C20 26 17 24 17 21C14 24 14 28 14 31C14 36 18 41 25 41Z" fill="#FFD700"/>
    </svg>
  );
}

// 3. 3D Tactile Bar Chart Badge (Blue #1CB0F6)
export function Duo3dChartBadge({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="38" width="40" height="6" rx="3" fill="#1479A7"/>
      <rect x="8" y="24" width="9" height="16" rx="2" fill="#1899D6"/>
      <rect x="8" y="22" width="9" height="16" rx="2" fill="#1CB0F6"/>
      <rect x="8" y="22" width="9" height="4" rx="2" fill="#52D1FF"/>

      <rect x="20" y="12" width="9" height="28" rx="2" fill="#1899D6"/>
      <rect x="20" y="10" width="9" height="28" rx="2" fill="#1CB0F6"/>
      <rect x="20" y="10" width="9" height="4" rx="2" fill="#52D1FF"/>

      <rect x="32" y="18" width="9" height="22" rx="2" fill="#1899D6"/>
      <rect x="32" y="16" width="9" height="22" rx="2" fill="#1CB0F6"/>
      <rect x="32" y="16" width="9" height="4" rx="2" fill="#52D1FF"/>

      <path d="M7 16L21 6L31 11L41 2" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M33 2H41V10" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 4. 3D Tactile Zap Lightning Bolt Badge (Yellow/Gold)
export function Duo3dZapBadge({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 2L5 18H15L13 30L27 13H17L19 2Z" fill="#D97706"/>
      <path d="M16 1L4 17H14L12 29L26 12H16L18 1Z" fill="#FFD700"/>
      <path d="M16 1L7 13H14L12 25L23 12H16L18 1Z" fill="#FFFBEB"/>
    </svg>
  );
}

// 5. 3D Tactile Lock Badge (Blue)
export function Duo3dLockBadge({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 14V9C10 5.68629 12.6863 3 16 3C19.3137 3 22 5.68629 22 9V14" stroke="#1479A7" strokeWidth="4" strokeLinecap="round"/>
      <path d="M10 13V8C10 4.68629 12.6863 2 16 2C19.3137 2 22 4.68629 22 8V13" stroke="#52D1FF" strokeWidth="4" strokeLinecap="round"/>
      <rect x="6" y="14" width="20" height="16" rx="4" fill="#1479A7"/>
      <rect x="6" y="12" width="20" height="16" rx="4" fill="#1CB0F6"/>
      <circle cx="16" cy="18" r="2.5" fill="white"/>
      <path d="M16 19.5V23.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

// 6. 3D Tactile Bell Badge (Orange Reminder)
export function Duo3dBellBadge({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="27" r="3" fill="#C2410C"/>
      <path d="M16 3C10.4772 3 6 7.47715 6 13V21L3 24V25H29V24L26 21V13C26 7.47715 21.5228 3 16 3Z" fill="#C2410C"/>
      <path d="M16 2C10.4772 2 6 6.47715 6 12V20L3 23V24H29V23L26 20V12C26 6.47715 21.5228 2 16 2Z" fill="#FF6B00"/>
      <circle cx="16" cy="26" r="3" fill="#FF852C"/>
      <path d="M12 9C12 9 14 5 17 5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// 7. 3D Tactile Check Badge (Green Check Seal)
export function Duo3dCheckBadge({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="17" r="13" fill="#3C8901"/>
      <circle cx="16" cy="15" r="13" fill="#58CC02"/>
      <circle cx="16" cy="15" r="11" fill="#79E824"/>
      <path d="M10 15L14 19L22 11" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 8. 3D Zen Mindset Badge (Disciplined - Green #58CC02)
export function Duo3dZenBadge({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="26" r="18" fill="#388202"/>
      <circle cx="24" cy="24" r="18" fill="#58CC02"/>
      <circle cx="24" cy="24" r="13" fill="#79E824"/>
      <ellipse cx="24" cy="13" rx="9" ry="3" fill="#FFFBEB" opacity="0.9"/>
      <path d="M17 29C17 24.5 20 21.5 24 21.5C28 21.5 31 24.5 31 29V33H17V29Z" fill="white"/>
      <circle cx="24" cy="18" r="3.5" fill="white"/>
    </svg>
  );
}

// 9. 3D Pulse Mindset Badge (Anxious - Sky Blue #1CB0F6)
export function Duo3dPulseBadge({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="34" rx="10" fill="#147BB0"/>
      <rect x="4" y="6" width="40" height="34" rx="10" fill="#1CB0F6"/>
      <rect x="7" y="9" width="34" height="28" rx="8" fill="#52D1FF"/>
      <path d="M9 23H16L20 13L26 33L30 23H39" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 10. 3D Crosshair Target Badge (Revenge - Red #FF4B4B)
export function Duo3dCrosshairBadge({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="26" r="18" fill="#C62828"/>
      <circle cx="24" cy="24" r="18" fill="#FF4B4B"/>
      <circle cx="24" cy="24" r="11" stroke="white" strokeWidth="3.5" fill="none"/>
      <circle cx="24" cy="24" r="4" fill="white"/>
      <path d="M24 3V9M24 39V45M3 24H9M39 24H45" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  );
}

// 11. 3D Rocket Speed Badge (FOMO - Gold #FFC800)
export function Duo3dRocketBadge({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 44L14 34L24 4L34 34L24 44Z" fill="#B88E00"/>
      <path d="M24 42L14 32L24 2L34 32L24 42Z" fill="#FFC800"/>
      <path d="M24 10L18 30H30L24 10Z" fill="#FFFBEB"/>
      <circle cx="24" cy="22" r="3.5" fill="#FF6B00"/>
      <path d="M20 39L24 45L28 39" stroke="#FF6B00" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

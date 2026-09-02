import React, { useEffect, useState } from 'react';

export default function ConfettiBurst({ triggerKey }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!triggerKey) return;

    const colors = ['#58CC02', '#1CB0F6', '#FF6B00', '#FFD700', '#CE82FF', '#FF4B4B'];
    const newParticles = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage X
      y: -10,
      size: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      speedX: (Math.random() - 0.5) * 60,
      speedY: Math.random() * 80 + 40,
      delay: Math.random() * 0.2,
      duration: Math.random() * 1.5 + 1.2,
      shape: Math.random() > 0.5 ? 'rounded-full' : 'rounded-sm'
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, [triggerKey]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${p.shape} animate-confetti-fall`}
          style={{
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg) scale(0.6);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confettiFall cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  );
}

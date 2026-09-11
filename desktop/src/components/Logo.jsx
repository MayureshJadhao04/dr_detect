import React from 'react';

export default function Logo({ size = 36 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="drDetectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="pupilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Anatomical Eye Contour */}
      <path 
        d="M3 20C7 9 14.5 4 20 4C25.5 4 33 9 37 20C33 31 25.5 36 20 36C14.5 36 7 31 3 20Z" 
        stroke="url(#drDetectGrad)" 
        strokeWidth="2.4" 
        strokeLinecap="round"
      />
      
      {/* Retinal Scanning Aperture Arc */}
      <circle 
        cx="20" 
        cy="20" 
        r="9.5" 
        stroke="url(#drDetectGrad)" 
        strokeWidth="1.8" 
        strokeDasharray="4 2.5" 
      />
      
      {/* Central Optic Disc / Foveal Core */}
      <circle 
        cx="20" 
        cy="20" 
        r="5.2" 
        fill="url(#pupilGrad)" 
        filter="url(#eyeGlow)" 
      />
      <circle cx="18.2" cy="18.2" r="1.6" fill="#ffffff" />
      
      {/* Precision Detection Crosshairs */}
      <path 
        d="M20 7V10.5M20 29.5V33M7 20H10.5M29.5 20H33" 
        stroke="#38bdf8" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

import React from 'react';
import logoImg from '../assets/dr-detect-logo.png';

export default function Logo({ width = 130, className = '', style = {} }) {
  return (
    <div
      className={`sidebar-logo ${className}`}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px 18px',
        userSelect: 'none',
        ...style
      }}
    >
      <img
        src={logoImg}
        alt="DRDetect"
        className="dr-detect-logo"
        style={{
          display: 'block',
          width: `${width}px`,
          height: 'auto',
          objectFit: 'contain',
          pointerEvents: 'none'
        }}
      />
      <div
        className="logo-tagline"
        style={{
          marginTop: '6px',
          fontSize: '9px',
          fontWeight: 600,
          color: '#60708A',
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 1.35,
          fontFamily: 'var(--font-sans)',
        }}
      >
        EARLY DETECTION <span style={{ color: '#EF5B63', fontWeight: 800 }}>·</span> BRIGHTER<br />TOMORROWS
      </div>
    </div>
  );
}

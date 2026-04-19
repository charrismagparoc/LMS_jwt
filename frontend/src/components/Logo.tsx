import React from 'react';
interface LogoProps { size?: number; }
const Logo: React.FC<LogoProps> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6"  y="34" width="36" height="7" rx="2" fill="#a97954"/>
    <rect x="9"  y="25" width="30" height="7" rx="2" fill="#c29b87"/>
    <rect x="12" y="16" width="24" height="7" rx="2" fill="#f6f2ea" opacity="0.9"/>
    <line x1="14" y1="16" x2="14" y2="23" stroke="#a97954" strokeWidth="1.5"/>
    <line x1="17" y1="25" x2="17" y2="32" stroke="#532c2e" strokeWidth="1.5"/>
    <line x1="20" y1="34" x2="20" y2="41" stroke="#34000b" strokeWidth="1.5"/>
    <path d="M16 10 C18 8 22 7 24 10 C26 7 30 8 32 10 L32 16 C30 14 26 13 24 16 C22 13 18 14 16 16 Z" fill="#c29b87"/>
    <line x1="24" y1="10" x2="24" y2="16" stroke="#a97954" strokeWidth="1"/>
  </svg>
);
export default Logo;

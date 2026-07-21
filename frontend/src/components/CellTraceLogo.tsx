import React from 'react';

interface CellTraceLogoProps {
  className?: string;
}

export const CellTraceLogo: React.FC<CellTraceLogoProps> = ({ className = "w-7 h-7" }) => {
  return (
    <div className={`${className} rounded-lg bg-[#deff00] text-black flex items-center justify-center p-1 shadow-md shadow-[#deff00]/25 shrink-0 transition-transform hover:scale-105`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        {/* Battery Top Terminal Nub */}
        <path d="M9.5 2h5a1 1 0 0 1 1 1v1h-7V3a1 1 0 0 1 1-1z" fill="currentColor" />
        {/* Battery Outer Casing Frame */}
        <rect x="4.5" y="4.5" width="15" height="17" rx="2.5" stroke="currentColor" strokeWidth="2.2" fill="none" />
        {/* Battery Telemetry Pulse Wave Signal */}
        <path
          d="M7 13h2.2l1.4-3.5 2 5.8 1.6-3.3H17"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

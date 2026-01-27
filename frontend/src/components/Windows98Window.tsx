import React from "react";

interface Windows98WindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export default function Windows98Window({
  title,
  children,
  onClose,
  className = "",
}: Windows98WindowProps) {
  return (
    <div
      className={`bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[2px_2px_0_0_#000000] ${className}`}
    >
      {/* Title Bar */}
      <div className="bg-[#000080] text-white px-1 py-0.5 flex items-center justify-between h-6">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-xs font-bold truncate">{title}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] text-black text-xs font-bold w-5 h-5 flex items-center justify-center hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
      {/* Content */}
      <div className="p-2 bg-[#c0c0c0]">{children}</div>
    </div>
  );
}


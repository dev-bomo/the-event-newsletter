import React from "react";

interface Windows98ReadingPaneProps {
  children: React.ReactNode;
  className?: string;
}

export default function Windows98ReadingPane({
  children,
  className = "",
}: Windows98ReadingPaneProps) {
  return (
    <div
      className={`bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-3 ${className}`}
    >
      {children}
    </div>
  );
}


import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const MIN_WIDTH = 320;
const MIN_HEIGHT = 300;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 640;
const FITCONTENT_WIDTH_DESKTOP = 680;
const FITCONTENT_TOP_OFFSET = 100;
const DEFAULT_HEIGHT_DESKTOP_CAP = 800;
const TASKBAR_HEIGHT = 36;   // Layout nav h-9 on desktop (bottom)
const FOOTER_HEIGHT = 56;    // Layout footer (py-2 + one line)
const MOBILE_BREAKPOINT = 768;
const MOBILE_MARGIN = 8;

function getDesktopWindowHeight(): number {
  const available = window.innerHeight - TASKBAR_HEIGHT - FOOTER_HEIGHT;
  return Math.max(MIN_HEIGHT, Math.min(DEFAULT_HEIGHT_DESKTOP_CAP, available));
}

interface Windows98WindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  fitContent?: boolean;
  controlledPosition?: { x: number; y: number };
  controlledSize?: { width: number; height: number };
  controlledZIndex?: number;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onMinimize?: () => void;
  onTitleClick?: () => void;
  mobileMargin?: boolean;
}

export default function Windows98Window({
  title,
  children,
  onClose,
  className = "",
  fitContent = false,
  controlledPosition,
  controlledSize,
  controlledZIndex,
  onPositionChange,
  onSizeChange,
  onMinimize,
  onTitleClick,
  mobileMargin = false,
}: Windows98WindowProps) {
  const isControlled = controlledPosition != null && controlledSize != null;
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(controlledPosition ?? { x: 0, y: 0 });
  const [size, setSize] = useState(controlledSize ?? { width: DEFAULT_WIDTH, height: 480 });
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );
  const [isFloating, setIsFloating] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

  const effectivePosition = isControlled ? controlledPosition! : position;
  const effectiveSize = isControlled ? controlledSize! : size;
  const effectiveZIndex = isControlled && controlledZIndex != null ? controlledZIndex : 40;

  const updateMobile = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  useEffect(() => {
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, [updateMobile]);

  // Center window on mount (desktop only; skip when controlled)
  useEffect(() => {
    if (isControlled) {
      setIsMounted(true);
      return;
    }
    const height = fitContent ? undefined : getDesktopWindowHeight();
    const widthForCenter = fitContent ? FITCONTENT_WIDTH_DESKTOP : DEFAULT_WIDTH;
    const x = Math.max(0, (window.innerWidth - widthForCenter) / 2);
    const y = fitContent
      ? FITCONTENT_TOP_OFFSET
      : Math.max(0, (window.innerHeight - (height ?? 0)) / 2);
    setPosition({ x, y });
    if (height != null) setSize((s) => ({ ...s, height }));
    setIsMounted(true);
  }, [fitContent, isControlled]);

  // On desktop, keep centered when mounted or window resized (skip when fitContent or controlled)
  useEffect(() => {
    if (!isMounted || isMobile || fitContent || isControlled) return;
    const syncSizeAndPosition = () => {
      const height = getDesktopWindowHeight();
      const x = Math.max(0, (window.innerWidth - DEFAULT_WIDTH) / 2);
      const y = Math.max(0, (window.innerHeight - height) / 2);
      setPosition({ x, y });
      setSize((s) => ({ ...s, height }));
    };
    syncSizeAndPosition();
    window.addEventListener("resize", syncSizeAndPosition);
    return () => window.removeEventListener("resize", syncSizeAndPosition);
  }, [isMounted, isMobile, fitContent, isControlled]);

  const handleClose = useCallback(() => {
    if (onMinimize) onMinimize();
    else if (onClose) onClose();
    else navigate("/");
  }, [onMinimize, onClose, navigate]);

  // Drag: title bar (on mobile, first drag switches from in-flow to floating; skip when mobileMargin to keep fitted)
  const handleTitlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      onTitleClick?.();
      if (isMobile && mobileMargin) return; // mobile: no drag, keep window fitted in viewport
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const pos = isControlled ? effectivePosition : position;
      if (isMobile && !isFloating && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
        setSize({ width: rect.width, height: rect.height });
        setIsFloating(true);
        dragRef.current = {
          startX: clientX,
          startY: clientY,
          startLeft: rect.left,
          startTop: rect.top,
        };
        return;
      }
      dragRef.current = {
        startX: clientX,
        startY: clientY,
        startLeft: pos.x,
        startTop: pos.y,
      };
    },
    [position, isMobile, isFloating, isControlled, effectivePosition, onTitleClick, mobileMargin]
  );

  useEffect(() => {
    if (!isMounted) return;
    const getCoords = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      const me = e as MouseEvent;
      return { x: me.clientX, y: me.clientY };
    };
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoords(e);
      if (dragRef.current) {
        if ("touches" in e) e.preventDefault();
        const newPos = {
          x: Math.max(0, dragRef.current.startLeft + x - dragRef.current.startX),
          y: Math.max(0, dragRef.current.startTop + y - dragRef.current.startY),
        };
        if (isControlled && onPositionChange) onPositionChange(newPos);
        else setPosition(newPos);
      } else if (resizeRef.current) {
        if ("touches" in e) e.preventDefault();
        const newWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, resizeRef.current.startWidth + (x - resizeRef.current.startX))
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          resizeRef.current.startHeight + (y - resizeRef.current.startY)
        );
        const newSize = { width: newWidth, height: newHeight };
        if (isControlled && onSizeChange) onSizeChange(newSize);
        else setSize(newSize);
      }
    };
    const handlePointerUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener("mousemove", handlePointerMove as (e: MouseEvent) => void);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove as (e: TouchEvent) => void, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove as (e: MouseEvent) => void);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove as (e: TouchEvent) => void);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isMounted, isControlled, onPositionChange, onSizeChange]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const s = isControlled ? effectiveSize : size;
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: s.width,
      startHeight: s.height,
    };
  }, [size, isControlled, effectiveSize]);

  return (
    <div
      ref={wrapperRef}
      className={`flex flex-col bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[2px_2px_0_0_#000000] ${isMobile && !isFloating ? "w-full" : ""} ${className}`}
      style={
        isMobile && !isFloating
          ? {
              maxWidth: MAX_WIDTH,
              ...(mobileMargin
                ? {
                    margin: MOBILE_MARGIN,
                    width: `calc(100vw - ${2 * MOBILE_MARGIN}px)`,
                    maxWidth: `calc(100vw - ${2 * MOBILE_MARGIN}px)`,
                  }
                : {}),
            }
          : (() => {
              const base =
                fitContent && !isMobile && !isControlled
                  ? {
                      left: "50%",
                      top: effectivePosition.y,
                      width: FITCONTENT_WIDTH_DESKTOP,
                      height: "auto" as const,
                      maxHeight: "90vh",
                      transform: "translateX(-50%)",
                    }
                  : fitContent && !isMobile
                  ? {
                      left: effectivePosition.x,
                      top: effectivePosition.y,
                      width: FITCONTENT_WIDTH_DESKTOP,
                      height: "auto" as const,
                      maxHeight: "90vh",
                    }
                  : {
                      left: effectivePosition.x,
                      top: effectivePosition.y,
                      width: effectiveSize.width,
                      height: effectiveSize.height,
                      maxWidth: MAX_WIDTH,
                    };
              if (isMobile && mobileMargin && typeof window !== "undefined") {
                const w = Math.min(
                  effectiveSize.width,
                  window.innerWidth - 2 * MOBILE_MARGIN
                );
                const h = Math.min(
                  effectiveSize.height,
                  window.innerHeight - 2 * MOBILE_MARGIN
                );
                const left = Math.max(
                  MOBILE_MARGIN,
                  Math.min(effectivePosition.x, window.innerWidth - w - MOBILE_MARGIN)
                );
                const top = Math.max(
                  MOBILE_MARGIN,
                  Math.min(effectivePosition.y, window.innerHeight - h - MOBILE_MARGIN)
                );
                return {
                  position: "fixed" as const,
                  zIndex: effectiveZIndex,
                  left,
                  top,
                  width: w,
                  height: h,
                  maxWidth: MAX_WIDTH,
                };
              }
              return {
                position: "fixed" as const,
                zIndex: effectiveZIndex,
                ...base,
              };
            })()
      }
    >
      {/* Title Bar - draggable */}
      <div
        role="button"
        tabIndex={0}
        onMouseDown={handleTitlePointerDown}
        onTouchStart={handleTitlePointerDown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.preventDefault();
        }}
        className="bg-[#000080] text-white px-1 py-0.5 flex items-center justify-between h-6 cursor-move select-none"
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-xs font-bold truncate">{title}</span>
        </div>
        <button
          onClick={handleClose}
          className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] text-black text-xs font-bold w-5 h-5 flex items-center justify-center hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] focus:outline-none shrink-0"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      {/* Content - scrollable when resized (floating) or when long (in-flow); when fitContent grows with content up to maxHeight */}
      <div
        className={
          "scrollbar-hide " +
          (isMobile && !isFloating
            ? "overflow-auto p-1 bg-[#c0c0c0]"
            : fitContent
            ? "overflow-auto p-1 bg-[#c0c0c0]"
            : "flex-1 min-h-0 overflow-auto p-1 bg-[#c0c0c0]")
        }
      >
        {children}
      </div>
      {/* Resize handle - only when floating and not fitContent */}
      {(!isMobile || isFloating) && !fitContent && (
        <div
          role="button"
          tabIndex={0}
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize border-t-2 border-l-2 border-[#808080] bg-[#c0c0c0]"
          aria-label="Resize"
          style={{ borderLeftColor: "#808080", borderTopColor: "#808080" }}
        />
      )}
    </div>
  );
}

import React, { createContext, useContext, useCallback, useReducer } from "react";

export type WindowId = "newsletters" | "preferences" | "help" | "dislikes";

interface WindowState {
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

type WindowsState = Record<WindowId, WindowState>;

const WINDOW_OFFSET = 28;
const DEFAULT_WIDTH = 640;
const TASKBAR_HEIGHT = 36;
const FOOTER_HEIGHT = 56;
const DEFAULT_HEIGHT_CAP = 800;

function getDefaultHeight(): number {
  const available = typeof window !== "undefined" ? window.innerHeight - TASKBAR_HEIGHT - FOOTER_HEIGHT : 600;
  return Math.min(DEFAULT_HEIGHT_CAP, Math.max(300, available));
}

function getInitialPosition(index: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 100 + index * WINDOW_OFFSET, y: 100 + index * WINDOW_OFFSET };
  const x = Math.max(0, (window.innerWidth - DEFAULT_WIDTH) / 2 + index * WINDOW_OFFSET);
  const y = Math.max(0, (window.innerHeight - getDefaultHeight()) / 2 + index * WINDOW_OFFSET);
  return { x, y };
}

const initialWindowsState: WindowsState = {
  newsletters: {
    isMinimized: true,
    position: getInitialPosition(0),
    size: { width: DEFAULT_WIDTH, height: getDefaultHeight() },
    zIndex: 1,
  },
  preferences: {
    isMinimized: true,
    position: getInitialPosition(1),
    size: { width: DEFAULT_WIDTH, height: getDefaultHeight() },
    zIndex: 2,
  },
  help: {
    isMinimized: true,
    position: getInitialPosition(2),
    size: { width: DEFAULT_WIDTH, height: getDefaultHeight() },
    zIndex: 3,
  },
  dislikes: {
    isMinimized: true,
    position: getInitialPosition(3),
    size: { width: DEFAULT_WIDTH, height: getDefaultHeight() },
    zIndex: 4,
  },
};

type Action =
  | { type: "OPEN"; id: WindowId }
  | { type: "MINIMIZE"; id: WindowId }
  | { type: "TOGGLE"; id: WindowId }
  | { type: "BRING_TO_FRONT"; id: WindowId }
  | { type: "SET_POSITION"; id: WindowId; position: { x: number; y: number } }
  | { type: "SET_SIZE"; id: WindowId; size: { width: number; height: number } };

let nextZIndex = 10;

function windowsReducer(state: WindowsState, action: Action): WindowsState {
  switch (action.type) {
    case "OPEN": {
      const id = action.id;
      const current = state[id];
      if (!current.isMinimized) {
        return { ...state, [id]: { ...current, zIndex: ++nextZIndex } };
      }
      const openCount = (["newsletters", "preferences", "help", "dislikes"] as WindowId[]).filter(
        (k) => !state[k].isMinimized
      ).length;
      const position = getInitialPosition(openCount);
      return {
        ...state,
        [id]: {
          isMinimized: false,
          position,
          size: { width: DEFAULT_WIDTH, height: getDefaultHeight() },
          zIndex: ++nextZIndex,
        },
      };
    }
    case "MINIMIZE":
      return {
        ...state,
        [action.id]: { ...state[action.id], isMinimized: true },
      };
    case "TOGGLE": {
      const id = action.id;
      const current = state[id];
      if (current.isMinimized) {
        const openCount = (["newsletters", "preferences", "help", "dislikes"] as WindowId[]).filter(
          (k) => !state[k].isMinimized
        ).length;
        const position = getInitialPosition(openCount);
        return {
          ...state,
          [id]: {
            isMinimized: false,
            position,
            size: { width: DEFAULT_WIDTH, height: getDefaultHeight() },
            zIndex: ++nextZIndex,
          },
        };
      }
      return {
        ...state,
        [id]: { ...current, isMinimized: true },
      };
    }
    case "BRING_TO_FRONT":
      return {
        ...state,
        [action.id]: { ...state[action.id], zIndex: ++nextZIndex },
      };
    case "SET_POSITION":
      return {
        ...state,
        [action.id]: { ...state[action.id], position: action.position },
      };
    case "SET_SIZE":
      return {
        ...state,
        [action.id]: { ...state[action.id], size: action.size },
      };
    default:
      return state;
  }
}

const WINDOW_IDS: WindowId[] = ["newsletters", "preferences", "help", "dislikes"];

interface WindowContextValue {
  windows: WindowsState;
  openWindow: (id: WindowId) => void;
  minimizeWindow: (id: WindowId) => void;
  minimizeAllExcept: (id: WindowId) => void;
  toggleWindow: (id: WindowId) => void;
  bringToFront: (id: WindowId) => void;
  setWindowPosition: (id: WindowId, position: { x: number; y: number }) => void;
  setWindowSize: (id: WindowId, size: { width: number; height: number }) => void;
}

const WindowContext = createContext<WindowContextValue | null>(null);

export function WindowProvider({ children }: { children: React.ReactNode }) {
  const [windows, dispatch] = useReducer(windowsReducer, initialWindowsState);

  const openWindow = useCallback((id: WindowId) => {
    dispatch({ type: "OPEN", id });
  }, []);

  const minimizeWindow = useCallback((id: WindowId) => {
    dispatch({ type: "MINIMIZE", id });
  }, []);

  const minimizeAllExcept = useCallback((id: WindowId) => {
    WINDOW_IDS.forEach((otherId) => {
      if (otherId !== id) dispatch({ type: "MINIMIZE", id: otherId });
    });
  }, []);

  const toggleWindow = useCallback((id: WindowId) => {
    dispatch({ type: "TOGGLE", id });
  }, []);

  const bringToFront = useCallback((id: WindowId) => {
    dispatch({ type: "BRING_TO_FRONT", id });
  }, []);

  const setWindowPosition = useCallback((id: WindowId, position: { x: number; y: number }) => {
    dispatch({ type: "SET_POSITION", id, position });
  }, []);

  const setWindowSize = useCallback((id: WindowId, size: { width: number; height: number }) => {
    dispatch({ type: "SET_SIZE", id, size });
  }, []);

  const value: WindowContextValue = {
    windows,
    openWindow,
    minimizeWindow,
    minimizeAllExcept,
    toggleWindow,
    bringToFront,
    setWindowPosition,
    setWindowSize,
  };

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
}

export function useWindowContext() {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error("useWindowContext must be used within WindowProvider");
  return ctx;
}

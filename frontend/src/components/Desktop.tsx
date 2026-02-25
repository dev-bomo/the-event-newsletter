import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWindowContext, type WindowId } from "../context/WindowContext";
import Windows98Window from "../components/Windows98Window";
import Newsletters from "../pages/Newsletters";
import Preferences from "../pages/Preferences";
import HelpWindowContent from "../components/HelpWindowContent";
import MyHates from "../pages/MyHates";

const MOBILE_BREAKPOINT = 768;
const PATH_TO_WINDOW: Record<string, WindowId> = {
  "/newsletters": "newsletters",
  "/preferences": "preferences",
};

export default function Desktop() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { windows, openWindow, minimizeWindow, minimizeAllExcept, bringToFront, setWindowPosition, setWindowSize } =
    useWindowContext();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // When route changes, open the corresponding window and bring to front. On mobile, only one window at a time.
  useEffect(() => {
    const id = PATH_TO_WINDOW[location.pathname];
    if (id) {
      if (isMobile) minimizeAllExcept(id);
      openWindow(id);
      bringToFront(id);
    }
  }, [location.pathname, isMobile, openWindow, bringToFront, minimizeAllExcept]);

  const windowConfig: Record<
    WindowId,
    { title: string; content: React.ReactNode }
  > = {
    newsletters: {
      title: t("newsletters.title"),
      content: <Newsletters embed />,
    },
    preferences: {
      title: t("preferences.title"),
      content: <Preferences embed />,
    },
    help: {
      title: t("dashboard.howItWorks.title"),
      content: (
        <HelpWindowContent
          onNavigateToPreferences={() => {
            openWindow("preferences");
            bringToFront("preferences");
            navigate("/preferences");
          }}
        />
      ),
    },
    dislikes: {
      title: t("hates.pageTitle"),
      content: <MyHates embed />,
    },
  };

  return (
    <>
      {(["newsletters", "preferences", "help", "dislikes"] as const).map((id) => {
        const win = windows[id];
        if (win.isMinimized) return null;
        const config = windowConfig[id];
        return (
          <Windows98Window
            key={id}
            title={config.title}
            fitContent={id === "help" || id === "dislikes"}
            mobileMargin
            controlledPosition={win.position}
            controlledSize={win.size}
            controlledZIndex={win.zIndex}
            onPositionChange={(pos) => setWindowPosition(id, pos)}
            onSizeChange={(size) => setWindowSize(id, size)}
            onMinimize={() => minimizeWindow(id)}
            onTitleClick={() => bringToFront(id)}
          >
            {config.content}
          </Windows98Window>
        );
      })}
    </>
  );
}

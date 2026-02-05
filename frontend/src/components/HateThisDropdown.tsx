import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";

export type HateType = "organizer" | "artist" | "venue";

interface Event {
  id: string;
  organizer?: string | null;
  artist?: string | null;
  venue?: string | null;
}

interface HateThisDropdownProps {
  event: Event;
  hatesCount: number;
  onHateAdded: (type: HateType, value: string) => void;
  onError: (msg: string) => void;
}

const HATE_LIMIT_FOR_CONFIRM = 10;

export default function HateThisDropdown({
  event,
  hatesCount,
  onHateAdded,
  onError,
}: HateThisDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{ type: HateType; value: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { type: HateType; value: string; labelKey: string }[] = [];
  if (event.organizer?.trim()) {
    options.push({
      type: "organizer",
      value: event.organizer.trim(),
      labelKey: "hates.excludeOrganizer",
    });
  }
  if (event.artist?.trim()) {
    options.push({
      type: "artist",
      value: event.artist.trim(),
      labelKey: "hates.excludeArtist",
    });
  }
  if (event.venue?.trim()) {
    options.push({
      type: "venue",
      value: event.venue.trim(),
      labelKey: "hates.excludeVenue",
    });
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addHate = async (type: HateType, value: string) => {
    setAdding(true);
    try {
      await api.post("/hates", { type, value });
      onHateAdded(type, value);
      setOpen(false);
      setPending(null);
    } catch (err: any) {
      onError(err.response?.data?.error || t("hates.addFailed"));
    } finally {
      setAdding(false);
    }
  };

  const handleOptionClick = (type: HateType, value: string) => {
    if (hatesCount >= HATE_LIMIT_FOR_CONFIRM) {
      setPending({ type, value });
    } else {
      addHate(type, value);
    }
  };

  const confirmAdd = () => {
    if (pending) {
      addHate(pending.type, pending.value);
    }
  };

  const cancelConfirm = () => {
    setPending(null);
  };

  if (options.length === 0) return null;

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs font-bold text-[#800000] hover:underline border-0 bg-transparent cursor-pointer p-0"
        title={t("hates.title")}
      >
        {t("hates.trigger")} ▾
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-lg min-w-[200px]">
          <div className="p-1 border-b border-[#808080] text-xs font-bold text-black">
            {t("hates.dropdownTitle")}
          </div>
          {options.map((opt) => (
            <button
              key={`${opt.type}-${opt.value}`}
              type="button"
              onClick={() => handleOptionClick(opt.type, opt.value)}
              disabled={adding}
              className="block w-full text-left px-2 py-1 text-xs text-black hover:bg-[#000080] hover:text-white disabled:opacity-50"
            >
              {t(opt.labelKey, { value: opt.value })}
            </button>
          ))}
        </div>
      )}

      {/* Confirmation when 10+ hates */}
      {pending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] p-4 max-w-md">
            <p className="text-xs font-bold text-black mb-2">
              {t("hates.confirmTitle")}
            </p>
            <p className="text-xs text-black mb-3">
              {t("hates.confirmMessage")}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelConfirm}
                className="win98-button"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmAdd}
                disabled={adding}
                className="win98-button bg-[#800000] text-white border-[#800000] disabled:opacity-50"
              >
                {adding ? t("common.loading") : t("hates.confirmAdd")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import { useAuthStore } from "../store/authStore";
import LoadingOverlay from "../components/LoadingOverlay";
import HateThisDropdown, { eventHateMatchesEvent } from "../components/HateThisDropdown";
import DislikeInfoModal, { hasSeenDislikeInfo } from "../components/DislikeInfoModal";
import api from "../lib/api";
import Windows98Window from "../components/Windows98Window";
import Windows98ReadingPane from "../components/Windows98ReadingPane";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  category?: string;
  sourceUrl: string;
  imageUrl?: string;
  score?: number | null;
  organizer?: string | null;
  artist?: string | null;
  venue?: string | null;
}

interface Newsletter {
  id: string;
  subject: string;
  htmlContent: string;
  sentAt?: string;
  createdAt: string;
  events: Array<{ event: Event }>;
}

export default function Newsletters() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDumpModal, setShowDumpModal] = useState(false);
  const [rawResponses, setRawResponses] = useState<string[]>([]);
  const [hatesCount, setHatesCount] = useState(0);
  const [hates, setHates] = useState<Array<{ type: string; value: string }>>([]);
  const [expandedDislikedIds, setExpandedDislikedIds] = useState<Set<string>>(new Set());
  const [showDislikeInfoModal, setShowDislikeInfoModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("testWizard") === "1") {
      navigate("/onboarding?testWizard=1");
      return;
    }
    loadNewsletters();
    loadHates();
  }, [navigate]);

  useEffect(() => {
    if (user === undefined) return;
    if (!user?.city) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  const loadHates = async () => {
    try {
      const res = await api.get("/hates");
      setHates(res.data ?? []);
      setHatesCount(res.data?.length ?? 0);
    } catch {
      // ignore
    }
  };

  const getHatedReasons = (event: Event): string[] => {
    const reasons: string[] = [];
    const match = (h: { type: string; value: string }, field: string | null | undefined) => {
      if (!field) return false;
      const a = field.toLowerCase();
      const b = h.value.toLowerCase();
      return a.includes(b) || b.includes(a);
    };
    if (hates.some((h) => h.type === "organizer" && match(h, event.organizer))) {
      reasons.push(t("hates.hatedOrganizer"));
    }
    if (hates.some((h) => h.type === "artist" && match(h, event.artist))) {
      reasons.push(t("hates.hatedArtist"));
    }
    if (hates.some((h) => h.type === "venue" && match(h, event.venue ?? event.location))) {
      reasons.push(t("hates.hatedVenue"));
    }
    if (hates.some((h) => h.type === "event" && eventHateMatchesEvent(h.value, event))) {
      reasons.push(t("hates.hatedEvent"));
    }
    return reasons;
  };

  const isEventDisliked = (event: Event): boolean => getHatedReasons(event).length > 0;

  const CATEGORY_COLORS = [
    "#000080", "#008000", "#800080", "#800000", "#008080",
    "#808000", "#004080", "#804000", "#408080", "#808080",
  ];
  const getCategoryColor = (category?: string | null): string => {
    const key = (category?.trim() || "(uncategorized)").toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash) + key.charCodeAt(i);
    return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
  };

  const expandDislikedEvent = (eventId: string) => {
    setExpandedDislikedIds((prev) => new Set(prev).add(eventId));
  };

  const collapseDislikedEvent = (eventId: string) => {
    setExpandedDislikedIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  };

  const loadNewsletters = async () => {
    try {
      const response = await api.get("/newsletters");
      setNewsletters(response.data);
    } catch (error) {
      console.error("Error loading newsletters:", error);
    }
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    setSuccess("");

    try {
      // Check for showDump query parameter
      const params = new URLSearchParams(window.location.search);
      const showDump = params.get("showDump") === "true" || params.get("showDump") === "1";
      
      const response = await api.post(
        `/newsletters/generate${showDump ? "?showDump=true" : ""}`
      );
      
      setSuccess(t("newsletters.generated"));
      await loadNewsletters();
      
      // If showDump is enabled and we have raw responses, show modal
      if (showDump && response.data.rawResponses) {
        setRawResponses(response.data.rawResponses);
        setShowDumpModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.generateNewsletterFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (newsletterId: string) => {
    setError("");
    setSending(newsletterId);
    setSuccess("");

    try {
      await api.post(`/newsletters/${newsletterId}/send`);
      setSuccess(t("newsletters.sentSuccess"));
      await loadNewsletters();
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.sendNewsletterFailed"));
    } finally {
      setSending(null);
    }
  };

  return (
    <Layout>
      <LoadingOverlay isVisible={generating} />
      <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
        <Windows98Window title={t("newsletters.title")}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <img
                  src="/attention.png"
                  alt=""
                  width={64}
                  height={64}
                  className="flex-shrink-0"
                  title={t("newsletters.autoNewsletterInfo")}
                  aria-hidden
                />
                <div className="flex flex-col gap-1 flex-1 min-w-0 max-w-md sm:max-w-none">
                  <p className="text-xs text-black leading-tight">
                    {t("newsletters.autoNewsletterInfo")}
                  </p>
                  {newsletters.length >= 5 && (
                    <p className="text-xs text-[#800000]">
                      {t("newsletters.limitReached")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex sm:items-center flex-shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleGenerate}
                  disabled={generating || newsletters.length >= 5}
                  className="win98-button disabled:opacity-50 w-full sm:w-auto"
                >
                  {generating ? t("newsletters.generating") : t("newsletters.generate")}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-3 py-2 text-xs text-black mb-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-3 py-2 text-xs text-black mb-3">
                {success}
              </div>
            )}

            {newsletters.length === 0 ? (
              <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-6 text-center">
                <p className="text-xs text-black">
                  {t("newsletters.noNewsletters")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {newsletters.map((newsletter) => (
                  <Windows98ReadingPane key={newsletter.id}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-bold text-black flex-1 min-w-0">{newsletter.subject}</h3>
                        <button
                          onClick={() => handleSend(newsletter.id)}
                          disabled={sending === newsletter.id || !!newsletter.sentAt}
                          className="win98-button disabled:opacity-50 shrink-0"
                        >
                          {sending === newsletter.id
                            ? t("newsletters.sending")
                            : newsletter.sentAt
                            ? t("newsletters.sent")
                            : t("newsletters.send")}
                        </button>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-black mb-2">
                          {t("newsletters.events")} ({newsletter.events.length}):
                        </h3>
                        <div className="space-y-2">
                          {newsletter.events.map(({ event }) => {
                            const disliked = isEventDisliked(event);
                            const collapsed = disliked && !expandedDislikedIds.has(event.id);

                            const score =
                              event.score !== null && event.score !== undefined
                                ? event.score
                                : null;
                            if (disliked && collapsed) {
                              return (
                                <div
                                  key={event.id}
                                  className="flex gap-2 py-1 items-start"
                                >
                                  <div className="w-9 shrink-0" aria-hidden />
                                  <button
                                    type="button"
                                    className="flex-1 text-left text-xs text-[#800000] font-bold hover:underline cursor-pointer min-w-0"
                                    onClick={() => expandDislikedEvent(event.id)}
                                  >
                                    {event.title}
                                  </button>
                                </div>
                              );
                            }

                            const categoryColor = getCategoryColor(event.category);

                            return (
                              <div key={event.id} className="flex gap-2 py-1 items-start">
                                <img
                                  src="/Calendar.ico"
                                  alt=""
                                  width={36}
                                  height={22}
                                  className="flex-shrink-0 object-contain mt-0.5"
                                  aria-hidden
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-black truncate">
                                    {event.title}
                                    {event.category && (
                                      <>
                                        {" · "}
                                        <span style={{ color: categoryColor }}>{event.category}</span>
                                      </>
                                    )}
                                  </p>
                                  <p className="text-xs text-black mt-0.5">
                                    📅 {new Date(event.date).toLocaleDateString()}
                                    {event.time && ` · 🕐 ${event.time}`}
                                    {" · 📍 "}{event.location}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                    {disliked && (
                                      <button
                                        type="button"
                                        onClick={() => collapseDislikedEvent(event.id)}
                                        className="text-xs text-[#808080] hover:underline"
                                      >
                                        ▲ {t("hates.collapse")}
                                      </button>
                                    )}
                                    {disliked ? (
                                      <span className="text-xs font-bold text-[#800000]">
                                        {t("hates.hatedLabel")}
                                      </span>
                                    ) : score !== null ? (
                                      <span
                                        className="text-xs font-bold"
                                        style={{
                                          color: score >= 80 ? "#008000" : score >= 60 ? "#808000" : "#800000",
                                        }}
                                      >
                                        {score}
                                      </span>
                                    ) : null}
                                    <a
                                      href={event.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#000080] hover:underline font-bold inline-flex items-center"
                                    >
                                      {t("newsletters.learnMore")} →
                                    </a>
                                    <HateThisDropdown
                                      event={event}
                                      hatesCount={hatesCount}
                                      onHateAdded={(type, value) => {
                                        loadHates();
                                        if (!hasSeenDislikeInfo()) {
                                          setShowDislikeInfoModal(true);
                                        }
                                        const typeLabel =
                                          type === "organizer"
                                            ? t("hates.typeOrganizer")
                                            : type === "artist"
                                            ? t("hates.typeArtist")
                                            : type === "venue"
                                            ? t("hates.typeVenue")
                                            : t("hates.typeEvent");
                                        const displayValue = type === "event" ? value.split("|")[0] : value;
                                        setSuccess(t("hates.addedSuccess", { type: typeLabel, value: displayValue }));
                                      }}
                                      onError={setError}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Windows98ReadingPane>
                ))}
              </div>
            )}
          </div>
        </Windows98Window>
      </div>

      {/* First-time dislike info modal */}
      <DislikeInfoModal
        isOpen={showDislikeInfoModal}
        onClose={() => setShowDislikeInfoModal(false)}
      />

      {/* Raw AI Response Modal */}
      {showDumpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh]">
            <Windows98Window title={t("newsletters.rawAiResponse")} onClose={() => setShowDumpModal(false)}>
              <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                {rawResponses.map((response, index) => (
                  <div key={index} className="mb-3">
                    <h3 className="text-xs font-bold text-black mb-2">
                      {t("newsletters.response")} {index + 1}:
                    </h3>
                    <pre className="bg-[#ffffff] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words text-black">
                      {response}
                    </pre>
                  </div>
                ))}
              </div>
            </Windows98Window>
          </div>
        </div>
      )}
    </Layout>
  );
}

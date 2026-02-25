import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import LoadingOverlay from "../components/LoadingOverlay";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import Windows98Window from "../components/Windows98Window";
import Windows98ReadingPane from "../components/Windows98ReadingPane";

const LOGO_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444",
  "#06B6D4", "#F97316", "#6366F1", "#14B8A6", "#A855F7", "#EAB308",
];
const CATEGORY_COLORS = [
  "#000080", "#008000", "#800080", "#800000", "#008080",
  "#808000", "#004080", "#804000", "#408080", "#808080",
];
function getTagColor(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}
function getCategoryColor(category?: string | null): string {
  const key = (category?.trim() || "(uncategorized)").toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash) + key.charCodeAt(i);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

interface Preferences {
  interests: string[];
  genres: string[];
  eventTypes: string[];
  venues: string[];
  artists: string[];
}

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
}

interface Newsletter {
  id: string;
  subject: string;
  htmlContent: string;
  events: Array<{ event: Event }>;
}

export default function OnboardingWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [city, setCity] = useState(user?.city || "");

  // Step 1: Preferences
  const [preferences, setPreferences] = useState<Preferences>({
    interests: [],
    genres: [],
    eventTypes: [],
    venues: [],
    artists: [],
  });
  const [newItem, setNewItem] = useState<{ [key: string]: string }>({});
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  // Event sources
  const [eventSources, setEventSources] = useState<
    Array<{ id: string; url: string; name?: string }>
  >([]);
  const [newEventSourceUrl, setNewEventSourceUrl] = useState("");
  const [newEventSourceName, setNewEventSourceName] = useState("");
  const [addingSource, setAddingSource] = useState(false);

  // Step 2: Newsletter Preview
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadPreferences();
    loadEventSources();
  }, []);

  // Step 1: Load and manage preferences
  const loadPreferences = async () => {
    setLoadingPreferences(true);
    try {
      const response = await api.get("/preferences");
      const { _limits, ...prefs } = response.data;
      setPreferences(prefs);
      if (user?.city) {
        setCity(user.city);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const loadEventSources = async () => {
    try {
      const response = await api.get("/event-sources");
      setEventSources(response.data);
    } catch (error) {
      console.error("Error loading event sources:", error);
    }
  };

  const handleAddEventSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAddingSource(true);

    try {
      const response = await api.post("/event-sources", {
        url: newEventSourceUrl,
        name: newEventSourceName || undefined,
      });
      setEventSources([...eventSources, response.data]);
      setNewEventSourceUrl("");
      setNewEventSourceName("");
      setSuccess(t("preferences.eventSources.added"));
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.addEventSourceFailed"));
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteEventSource = async (id: string) => {
    setError("");
    try {
      await api.delete(`/event-sources/${id}`);
      setEventSources(eventSources.filter((s) => s.id !== id));
      setSuccess(t("preferences.eventSources.removed"));
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.removeEventSourceFailed"));
    }
  };

  const addPreferenceItem = (category: keyof Preferences) => {
    const value = newItem[category]?.trim();
    if (!value) return;

    // Split by comma and process each item
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length === 0) return;

    setPreferences((prev) => ({
      ...prev,
      [category]: [...prev[category], ...items],
    }));
    setNewItem({ ...newItem, [category]: "" });
  };

  const removePreferenceItem = (category: keyof Preferences, index: number) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleSavePreferencesAndContinue = async () => {
    setError("");
    if (!city) {
      setError(t("onboarding.setCityRequired"));
      return;
    }
    try {
      await api.put("/preferences", { ...preferences, city });

      // Update user in auth store with new city
      if (user && token) {
        setAuth(token, { ...user, city });
      }

      setSuccess(t("preferences.preferencesSection.saved"));
      setTimeout(() => {
        setCurrentStep(2);
        setSuccess("");
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.savePreferencesFailed"));
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(t("preferences.resetConfirm"));

    if (!confirmed) {
      return;
    }

    setError("");
    setResetting(true);
    setSuccess("");

    try {
      const response = await api.delete("/preferences/reset");
      setPreferences(response.data);
      setSuccess(t("preferences.resetSuccess"));
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.resetPreferencesFailed"));
    } finally {
      setResetting(false);
    }
  };

  // Step 2: Generate newsletter
  const handleGenerateNewsletter = async () => {
    setError("");
    setGenerating(true);
    setSuccess("");

    try {
      const response = await api.post("/newsletters/generate");
      setNewsletter(response.data);
      setSuccess(t("newsletters.generated"));
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.generateNewsletterFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = () => {
    navigate("/newsletters");
  };

  const categories: Array<{
    key: keyof Preferences;
    labelKey: string;
    placeholderKey: string;
  }> = [
    { key: "interests", labelKey: "interests", placeholderKey: "interests" },
    { key: "genres", labelKey: "genres", placeholderKey: "genres" },
    { key: "eventTypes", labelKey: "eventTypes", placeholderKey: "eventTypes" },
    { key: "venues", labelKey: "venues", placeholderKey: "venues" },
    { key: "artists", labelKey: "artists", placeholderKey: "artists" },
  ];

  return (
    <Layout>
      <LoadingOverlay isVisible={generating} />
      <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
        <Windows98Window title={t("onboarding.step1Title")}>
          <div className="space-y-1">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-6 h-6 flex items-center justify-center text-xs font-bold border-2 ${
                  currentStep >= 1
                    ? "bg-[#000080] border-[#000080] text-white"
                    : "bg-[#c0c0c0] border-[#808080] text-black"
                }`}
              >
                1
              </div>
              <div className="flex-1 h-0.5 bg-[#808080]" />
              <div
                className={`w-6 h-6 flex items-center justify-center text-xs font-bold border-2 ${
                  currentStep >= 2
                    ? "bg-[#000080] border-[#000080] text-white"
                    : "bg-[#c0c0c0] border-[#808080] text-black"
                }`}
              >
                2
              </div>
            </div>

            {error && (
              <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-3 py-2 text-xs text-black">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-3 py-2 text-xs text-black">
                {success}
              </div>
            )}

            {currentStep === 1 && (
              <>
                <Windows98ReadingPane>
                  <p className="text-xs text-black mb-4">{t("onboarding.intro")}</p>
                </Windows98ReadingPane>

                <Windows98ReadingPane>
                  <h3 className="text-xs font-bold text-black mb-2">
                    {t("preferences.preferencesSection.title")}
                  </h3>
                  <p className="text-xs text-black mb-2">
                    {t("preferences.preferencesSection.description")}
                  </p>
                  <p className="text-xs text-black mb-3 text-[#000080] font-bold">
                    {t("preferences.keywordsHint")}
                  </p>

                  {loadingPreferences ? (
                    <div className="text-xs text-black py-4">{t("common.loading")}</div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label htmlFor="city" className="block text-xs font-bold text-black mb-1">
                          {t("preferences.preferencesSection.city")} *
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="win98-input block w-full"
                          placeholder={t("preferences.preferencesSection.cityPlaceholder")}
                          required
                        />
                      </div>

                      {categories.map((category) => (
                        <div key={category.key} className="mb-4">
                          <h3 className="text-xs font-bold text-black mb-2">
                            {t(`preferences.categories.${category.labelKey}`)}
                          </h3>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={newItem[category.key] || ""}
                              onChange={(e) =>
                                setNewItem({ ...newItem, [category.key]: e.target.value })
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addPreferenceItem(category.key);
                                }
                              }}
                              className="win98-input flex-1"
                              placeholder={t(`preferences.placeholders.${category.placeholderKey}`)}
                            />
                            <button onClick={() => addPreferenceItem(category.key)} className="win98-button">
                              {t("common.add")}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {preferences[category.key].map((item, index) => {
                              const tagColor = getTagColor(item);
                              return (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 text-xs font-bold text-white border-2 border-[#808080]"
                                  style={{ backgroundColor: tagColor, borderColor: tagColor }}
                                >
                                  {item}
                                  <button
                                    onClick={() => removePreferenceItem(category.key, index)}
                                    className="ml-2 text-white hover:text-black font-bold"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                            {preferences[category.key].length === 0 && (
                              <span className="text-xs text-black">
                                {t("preferences.preferencesSection.noItems")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </Windows98ReadingPane>

                <Windows98ReadingPane>
                  <h3 className="text-xs font-bold text-black mb-2">
                    {t("preferences.eventSources.title")}
                  </h3>
                  <p className="text-xs text-black mb-3">
                    {t("preferences.eventSources.description")}
                  </p>
                  <form onSubmit={handleAddEventSource} className="mb-3">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={newEventSourceUrl}
                        onChange={(e) => setNewEventSourceUrl(e.target.value)}
                        className="win98-input flex-1"
                        placeholder={t("preferences.eventSources.urlPlaceholder")}
                        required
                      />
                      <input
                        type="text"
                        value={newEventSourceName}
                        onChange={(e) => setNewEventSourceName(e.target.value)}
                        className="win98-input w-48"
                        placeholder={t("preferences.eventSources.namePlaceholder")}
                      />
                      <button
                        type="submit"
                        disabled={addingSource}
                        className="win98-button disabled:opacity-50"
                      >
                        {addingSource ? t("preferences.eventSources.adding") : t("common.add")}
                      </button>
                    </div>
                  </form>
                  {eventSources.length > 0 ? (
                    <div className="space-y-2">
                      {eventSources.map((source) => {
                        const tagColor = getTagColor(source.name || source.url);
                        const mellowColor = hexToRgba(tagColor, 0.5);
                        return (
                          <div
                            key={source.id}
                            className="flex items-center justify-between p-2 border-2 border-[#808080]"
                            style={{ backgroundColor: mellowColor, borderColor: mellowColor }}
                          >
                            <div className="flex-1">
                              {source.name && (
                                <div className="text-xs font-bold text-black">{source.name}</div>
                              )}
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#000080] hover:underline break-all"
                              >
                                {source.url}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteEventSource(source.id)}
                              className="ml-4 win98-button text-xs"
                            >
                              {t("common.remove")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-black">{t("preferences.eventSources.noSources")}</p>
                  )}
                </Windows98ReadingPane>

                <div className="flex justify-between mt-4">
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="win98-button disabled:opacity-50"
                  >
                    {resetting ? t("preferences.resetting") : t("preferences.resetAll")}
                  </button>
                  <button
                    onClick={handleSavePreferencesAndContinue}
                    disabled={!city}
                    className="win98-button disabled:opacity-50"
                  >
                    {t("onboarding.continueToPreview")}
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <Windows98ReadingPane>
                  <h3 className="text-xs font-bold text-black mb-2">
                    {t("onboarding.step2Title")}
                  </h3>
                  <p className="text-xs text-black mb-4">{t("onboarding.step2Description")}</p>

                  {!newsletter ? (
                    <div className="py-6 text-center">
                      <button
                        onClick={handleGenerateNewsletter}
                        disabled={generating}
                        className="win98-button disabled:opacity-50"
                      >
                        {generating ? t("onboarding.generating") : t("onboarding.generatePreview")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <h3 className="text-xs font-bold text-black mb-2">
                          {t("onboarding.eventsFound")} ({newsletter.events.length}):
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {newsletter.events.map(({ event }) => {
                            const categoryColor = getCategoryColor(event.category);
                            const score = event.score !== null && event.score !== undefined ? event.score : null;
                            const dateStr = new Date(event.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
                            return (
                              <div
                                key={event.id}
                                className="flex gap-2 py-1 items-start"
                              >
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
                                    📅 {dateStr}
                                    {event.time && ` · 🕐 ${event.time}`}
                                    {" · 📍 "}{event.location}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                    {score !== null && (
                                      <span
                                        className="text-xs font-bold"
                                        style={{
                                          color: score >= 80 ? "#008000" : score >= 60 ? "#808000" : "#800000",
                                        }}
                                      >
                                        {score}
                                      </span>
                                    )}
                                    {event.sourceUrl && (
                                      <a
                                        href={event.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#000080] hover:underline font-bold inline-flex items-center"
                                      >
                                        {t("newsletters.learnMore")} →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="win98-button"
                        >
                          ← {t("common.back")}
                        </button>
                        <button onClick={handleComplete} className="win98-button">
                          {t("onboarding.completeSetup")} ✓
                        </button>
                      </div>
                    </>
                  )}
                </Windows98ReadingPane>
              </>
            )}
          </div>
        </Windows98Window>
      </div>
    </Layout>
  );
}

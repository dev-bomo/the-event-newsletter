import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import Windows98Window from "../components/Windows98Window";
import Windows98ReadingPane from "../components/Windows98ReadingPane";

// Logo color palette - vibrant colors typical of modern logos
const LOGO_COLORS = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Green
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#A855F7", // Violet
  "#EAB308", // Yellow
];

// Get a consistent color for a tag based on its text
function getTagColor(text: string): string {
  // Simple hash function to get consistent color for same text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LOGO_COLORS.length;
  return LOGO_COLORS[index];
}

// Convert hex color to rgba with opacity
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

interface EventSource {
  id: string;
  url: string;
  name?: string;
  createdAt: string;
}

export default function Preferences() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<Preferences>({
    interests: [],
    genres: [],
    eventTypes: [],
    venues: [],
    artists: [],
  });
  const [city, setCity] = useState(user?.city || "");
  const [newItem, setNewItem] = useState<{ [key: string]: string }>({});
  const [eventSources, setEventSources] = useState<EventSource[]>([]);
  const [newEventSourceUrl, setNewEventSourceUrl] = useState("");
  const [newEventSourceName, setNewEventSourceName] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetting, setResetting] = useState(false);
  const [preferenceLimits, setPreferenceLimits] = useState<{
    canEdit: boolean;
    remaining?: number;
    nextAllowedAt?: string;
  } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [prefsRes, sourcesRes] = await Promise.all([
        api.get("/preferences"),
        api.get("/event-sources"),
      ]);
      const { _limits, ...prefs } = prefsRes.data;
      setPreferences(prefs);
      setEventSources(sourcesRes.data);
      setPreferenceLimits(_limits || null);
      // Load city from user object if available
      if (user?.city) {
        setCity(user.city);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (category: keyof Preferences) => {
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

  const removeItem = (category: keyof Preferences, index: number) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    setSuccess("");

    try {
      await api.put("/preferences", { ...preferences, city });
      const prefsRes = await api.get("/preferences");
      const { _limits } = prefsRes.data;
      setPreferenceLimits(_limits || null);
      setSuccess(t("preferences.preferencesSection.saved"));
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.savePreferencesFailed"));
    } finally {
      setSaving(false);
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
      const prefsRes = await api.get("/preferences");
      const { _limits } = prefsRes.data;
      setPreferenceLimits(_limits || null);
      setSuccess(t("preferences.resetSuccess"));
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.resetPreferencesFailed"));
    } finally {
      setResetting(false);
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
      const prefsRes = await api.get("/preferences");
      const { _limits } = prefsRes.data;
      setPreferenceLimits(_limits || null);
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
      const prefsRes = await api.get("/preferences");
      const { _limits } = prefsRes.data;
      setPreferenceLimits(_limits || null);
      setSuccess(t("preferences.eventSources.removed"));
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.removeEventSourceFailed"));
    }
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

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
          <Windows98Window title={t("preferences.title")}>
            <div className="p-3 text-xs text-black">{t("common.loading")}</div>
          </Windows98Window>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
        <Windows98Window title={t("preferences.title")}>
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-xs text-black mb-2">
                {t("preferences.description")}
              </p>
              {preferenceLimits && (
                <p className="text-xs text-black">
                  {preferenceLimits.canEdit ? (
                    preferenceLimits.remaining !== undefined &&
                    preferenceLimits.remaining >= 0 ? (
                      <span>
                        {t("preferencesLimits.remaining", {
                          remaining: preferenceLimits.remaining,
                        })}
                      </span>
                    ) : null
                  ) : preferenceLimits.nextAllowedAt ? (
                    <span className="text-[#800000]">
                      {t("preferencesLimits.limitReached", {
                        days: Math.ceil(
                          (new Date(preferenceLimits.nextAllowedAt).getTime() -
                            Date.now()) /
                            (1000 * 60 * 60 * 24)
                        ),
                      })}
                    </span>
                  ) : (
                    <span className="text-[#800000]">
                      {t("preferencesLimits.explanation")}
                    </span>
                  )}
                </p>
              )}
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

            {/* Section 1: Enter or Fine-tune Preferences */}
            <Windows98ReadingPane>
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-black mb-2">
                  {t("preferences.preferencesSection.title")}
                </h3>
                <p className="text-xs text-black mb-3">
                  {t("preferences.preferencesSection.description")}
                </p>

                <div className="mb-4">
                  <label
                    htmlFor="city"
                    className="block text-xs font-bold text-black mb-1"
                  >
                    {t("preferences.preferencesSection.city")}
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="win98-input block w-full"
                    placeholder={t("preferences.preferencesSection.cityPlaceholder")}
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
                            addItem(category.key);
                          }
                        }}
                        className="win98-input flex-1"
                        placeholder={t(`preferences.placeholders.${category.placeholderKey}`)}
                      />
                      <button
                        onClick={() => addItem(category.key)}
                        className="win98-button"
                      >
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
                            style={{
                              backgroundColor: tagColor,
                              borderColor: tagColor,
                            }}
                          >
                            {item}
                            <button
                              onClick={() => removeItem(category.key, index)}
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
              </div>
            </Windows98ReadingPane>

            {/* Section 2: Enter Links for Event Postings */}
            <Windows98ReadingPane>
              <div className="space-y-3">
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
                      disabled={addingSource || (preferenceLimits ? !preferenceLimits.canEdit : false)}
                      className="win98-button disabled:opacity-50"
                    >
                      {addingSource ? t("preferences.eventSources.adding") : t("common.add")}
                    </button>
                  </div>
                </form>

                {eventSources.length > 0 ? (
                  <div className="space-y-2">
                    {eventSources.map((source) => {
                      // Use name if available, otherwise use URL for color consistency
                      const colorKey = source.name || source.url;
                      const tagColor = getTagColor(colorKey);
                      const mellowColor = hexToRgba(tagColor, 0.5);
                      return (
                        <div
                          key={source.id}
                          className="flex items-center justify-between p-2 border-2 border-[#808080]"
                          style={{
                            backgroundColor: mellowColor,
                            borderColor: mellowColor,
                          }}
                        >
                          <div className="flex-1">
                            {source.name && (
                              <div className="text-xs font-bold text-black">
                                {source.name}
                              </div>
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
                            onClick={() => handleDeleteEventSource(source.id)}
                            disabled={preferenceLimits ? !preferenceLimits.canEdit : false}
                            className="ml-4 win98-button text-xs disabled:opacity-50"
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
              </div>
            </Windows98ReadingPane>

            <div className="flex justify-between mt-4">
              <button
                onClick={handleReset}
                disabled={resetting || (preferenceLimits ? !preferenceLimits.canEdit : false)}
                className="win98-button disabled:opacity-50"
              >
                {resetting ? t("preferences.resetting") : t("preferences.resetAll")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (preferenceLimits ? !preferenceLimits.canEdit : false)}
                className="win98-button disabled:opacity-50"
              >
                {saving ? t("preferences.saving") : t("preferences.savePreferences")}
              </button>
            </div>
          </div>
        </Windows98Window>
      </div>
    </Layout>
  );
}

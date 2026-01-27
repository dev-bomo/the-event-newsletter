import { useState, useEffect } from "react";
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

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [prefsRes, sourcesRes] = await Promise.all([
        api.get("/preferences"),
        api.get("/event-sources"),
      ]);
      setPreferences(prefsRes.data);
      setEventSources(sourcesRes.data);
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
      await Promise.all([
        api.put("/preferences", preferences),
        api.put("/preferences/city", { city }),
      ]);
      setSuccess("Preferences saved!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all preferences? This will clear all your interests, genres, event types, venues, and artists. This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setResetting(true);
    setSuccess("");

    try {
      const response = await api.delete("/preferences/reset");
      setPreferences(response.data);
      setSuccess("All preferences have been reset.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset preferences");
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
      setSuccess("Event source added!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add event source");
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteEventSource = async (id: string) => {
    setError("");
    try {
      await api.delete(`/event-sources/${id}`);
      setEventSources(eventSources.filter((s) => s.id !== id));
      setSuccess("Event source removed!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove event source");
    }
  };

  const categories: Array<{
    key: keyof Preferences;
    label: string;
    placeholder: string;
  }> = [
    {
      key: "interests",
      label: "Interests",
      placeholder:
        "e.g., music, movies, theater, philosophy, programming, art, sports, food, literature, science",
    },
    {
      key: "genres",
      label: "Genres",
      placeholder:
        "e.g., rock, drama, comedy, existentialism, web development, contemporary, basketball, fine dining, poetry, physics",
    },
    {
      key: "eventTypes",
      label: "Event Types",
      placeholder:
        "e.g., concerts, film screenings, plays, lectures, hackathons, exhibitions, games, food festivals, book readings, talks",
    },
    {
      key: "venues",
      label: "Venues",
      placeholder:
        "e.g., Blue Note, Lincoln Center, The Met, Madison Square Garden, local theaters, art galleries, concert halls",
    },
    {
      key: "artists",
      label: "Artists",
      placeholder: "e.g., artist names, bands",
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
          <Windows98Window title="Preferences">
            <div className="p-3 text-xs text-black">Loading...</div>
          </Windows98Window>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
        <Windows98Window title="Preferences">
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-xs text-black">
                Manage your preferences to get personalized event recommendations.
              </p>
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
                <h3 className="text-xs font-bold text-black mb-2">1. Enter Your Preferences</h3>
                <p className="text-xs text-black mb-3">
                  Add your interests, genres, venues, artists, and other preferences
                  to get personalized event recommendations.
                </p>

                <div className="mb-4">
                  <label
                    htmlFor="city"
                    className="block text-xs font-bold text-black mb-1"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="win98-input block w-full"
                    placeholder="e.g., New York, NY"
                  />
                </div>

                {categories.map((category) => (
                  <div key={category.key} className="mb-4">
                    <h3 className="text-xs font-bold text-black mb-2">{category.label}</h3>
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
                        placeholder={category.placeholder}
                      />
                      <button
                        onClick={() => addItem(category.key)}
                        className="win98-button"
                      >
                        Add
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
                          No items added yet
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
                <h3 className="text-xs font-bold text-black mb-2">2. Enter Links for Event Postings</h3>
                <p className="text-xs text-black mb-3">
                  Add URLs to venues or event providers you normally follow. These
                  will be checked for events in your newsletter.
                </p>

                <form onSubmit={handleAddEventSource} className="mb-3">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={newEventSourceUrl}
                      onChange={(e) => setNewEventSourceUrl(e.target.value)}
                      className="win98-input flex-1"
                      placeholder="https://example.com/events or https://theater.com/calendar"
                      required
                    />
                    <input
                      type="text"
                      value={newEventSourceName}
                      onChange={(e) => setNewEventSourceName(e.target.value)}
                      className="win98-input w-48"
                      placeholder="Name (optional)"
                    />
                    <button
                      type="submit"
                      disabled={addingSource}
                      className="win98-button disabled:opacity-50"
                    >
                      {addingSource ? "Adding..." : "Add"}
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
                            className="ml-4 win98-button text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-black">No event sources added yet</p>
                )}
              </div>
            </Windows98ReadingPane>

            <div className="flex justify-between mt-4">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="win98-button disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Reset All Preferences"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="win98-button disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </Windows98Window>
      </div>
    </Layout>
  );
}

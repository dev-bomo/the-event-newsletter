import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

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
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [checkingYoutube, setCheckingYoutube] = useState(true);
  const [syncingYoutube, setSyncingYoutube] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkYouTubeStatus();

    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get("youtube_connected") === "true") {
      setSuccess(
        "YouTube account connected successfully! Preferences have been updated."
      );
      // Clean up URL
      window.history.replaceState({}, "", "/preferences");
    }
    if (params.get("error")) {
      setError(`YouTube connection failed: ${params.get("error")}`);
      window.history.replaceState({}, "", "/preferences");
    }
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

    setPreferences((prev) => ({
      ...prev,
      [category]: [...prev[category], value],
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

  const checkYouTubeStatus = async () => {
    try {
      const response = await api.get("/auth/youtube/status");
      setYoutubeConnected(response.data.connected);
    } catch (error) {
      console.error("Error checking YouTube status:", error);
    } finally {
      setCheckingYoutube(false);
    }
  };

  const handleConnectYouTube = async () => {
    setError("");
    try {
      const response = await api.get("/auth/youtube/connect");
      // Redirect to YouTube OAuth
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to initiate YouTube connection"
      );
    }
  };

  const handleDisconnectYouTube = async () => {
    setError("");
    if (!confirm("Are you sure you want to disconnect your YouTube account?")) {
      return;
    }
    try {
      await api.delete("/auth/youtube/disconnect");
      setYoutubeConnected(false);
      setSuccess("YouTube account disconnected successfully");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to disconnect YouTube account"
      );
    }
  };

  const handleSyncYouTube = async () => {
    setError("");
    setSyncingYoutube(true);
    try {
      const response = await api.post("/auth/youtube/sync");
      setSuccess(
        `YouTube preferences synced! Found ${response.data.youtubeData.channelsCount} channels and ${response.data.youtubeData.playlistsCount} playlists.`
      );
      // Reload preferences to show updated data
      await loadPreferences();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to sync YouTube preferences"
      );
    } finally {
      setSyncingYoutube(false);
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
      placeholder: "e.g., jazz music, art galleries",
    },
    {
      key: "genres",
      label: "Genres",
      placeholder: "e.g., rock, classical, indie",
    },
    {
      key: "eventTypes",
      label: "Event Types",
      placeholder: "e.g., concerts, theater, festivals",
    },
    {
      key: "venues",
      label: "Venues",
      placeholder: "e.g., Blue Note, Lincoln Center",
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
        <div className="px-4 py-6 sm:px-0">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Preferences</h1>
          <p className="text-gray-600">
            Manage your preferences to get personalized event recommendations.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Section 1: Connect with Social Accounts */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            1. Connect with Social Accounts
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect your accounts to automatically extract preferences from your
            activity.
          </p>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center text-white font-bold mr-3">
                  YT
                </div>
                <div>
                  <div className="font-medium text-gray-900">YouTube</div>
                  <div className="text-sm text-gray-500">
                    {checkingYoutube
                      ? "Checking status..."
                      : youtubeConnected
                      ? "Connected"
                      : "Not connected"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {youtubeConnected ? (
                  <>
                    <button
                      onClick={handleSyncYouTube}
                      disabled={syncingYoutube}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {syncingYoutube ? "Syncing..." : "Sync Now"}
                    </button>
                    <button
                      onClick={handleDisconnectYouTube}
                      className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectYouTube}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Connect YouTube
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Enter or Fine-tune Preferences */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            2. Enter or Fine-tune Preferences
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Add your interests, genres, and preferences. If you connected social
            accounts, these may already be populated.
          </p>

          <div className="mb-6">
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              City
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g., New York, NY"
            />
          </div>

          {categories.map((category) => (
            <div key={category.key} className="mb-6">
              <h3 className="font-semibold mb-2">{category.label}</h3>
              <div className="flex gap-2 mb-4">
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
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder={category.placeholder}
                />
                <button
                  onClick={() => addItem(category.key)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences[category.key].map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {item}
                    <button
                      onClick={() => removeItem(category.key, index)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {preferences[category.key].length === 0 && (
                  <span className="text-gray-400 text-sm">
                    No items added yet
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Section 3: Enter Links for Event Postings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            3. Enter Links for Event Postings
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Add URLs to venues or event providers you normally follow. These
            will be checked for events in your newsletter.
          </p>

          <form onSubmit={handleAddEventSource} className="mb-4">
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={newEventSourceUrl}
                onChange={(e) => setNewEventSourceUrl(e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                placeholder="https://example.com/events or https://theater.com/calendar"
                required
              />
              <input
                type="text"
                value={newEventSourceName}
                onChange={(e) => setNewEventSourceName(e.target.value)}
                className="w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                placeholder="Name (optional)"
              />
              <button
                type="submit"
                disabled={addingSource}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {addingSource ? "Adding..." : "Add"}
              </button>
            </div>
          </form>

          {eventSources.length > 0 ? (
            <div className="space-y-2">
              {eventSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                >
                  <div className="flex-1">
                    {source.name && (
                      <div className="font-medium text-gray-900">
                        {source.name}
                      </div>
                    )}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-500 break-all"
                    >
                      {source.url}
                    </a>
                  </div>
                  <button
                    onClick={() => handleDeleteEventSource(source.id)}
                    className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No event sources added yet</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </Layout>
  );
}

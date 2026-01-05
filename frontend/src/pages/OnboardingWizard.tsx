import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
}

interface Newsletter {
  id: string;
  subject: string;
  htmlContent: string;
  events: Array<{ event: Event }>;
}

export default function OnboardingWizard() {
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

  // YouTube connection
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [checkingYoutube, setCheckingYoutube] = useState(true);

  // Step 2: Newsletter Preview
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPreferences();
    checkYouTubeStatus();
    loadEventSources();

    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get("youtube_connected") === "true") {
      setSuccess(
        "YouTube account connected successfully! Preferences have been updated."
      );
      window.history.replaceState({}, "", "/onboarding");
      loadPreferences(); // Reload to get updated preferences
    }
    if (params.get("error")) {
      setError(`YouTube connection failed: ${params.get("error")}`);
      window.history.replaceState({}, "", "/onboarding");
    }
  }, []);

  // Step 1: Load and manage preferences
  const loadPreferences = async () => {
    setLoadingPreferences(true);
    try {
      const response = await api.get("/preferences");
      setPreferences(response.data);
      // Load city from user object if available
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
      const response = await api.get("/auth/youtube/connect", {
        params: { returnUrl: "/onboarding" },
      });
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to initiate YouTube connection"
      );
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

  const addPreferenceItem = (category: keyof Preferences) => {
    const value = newItem[category]?.trim();
    if (!value) return;

    setPreferences((prev) => ({
      ...prev,
      [category]: [...prev[category], value],
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
    try {
      await Promise.all([
        api.put("/preferences", preferences),
        api.put("/preferences/city", { city }),
      ]);

      if (!city) {
        setError("Please set your city");
        return;
      }

      // Update user in auth store with new city
      if (user && token) {
        setAuth(token, { ...user, city });
      }

      setSuccess("Preferences saved!");
      setTimeout(() => {
        setCurrentStep(2);
        setSuccess("");
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save preferences");
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
      setSuccess("Newsletter generated!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate newsletter");
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = () => {
    navigate("/dashboard");
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

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 2 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      currentStep > step ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 text-sm text-gray-600">
            <div
              className={
                currentStep === 1 ? "font-semibold text-indigo-600" : ""
              }
            >
              Set Preferences
            </div>
            <div className="mx-4">→</div>
            <div
              className={
                currentStep === 2 ? "font-semibold text-indigo-600" : ""
              }
            >
              Preview Newsletter
            </div>
          </div>
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

        {/* Intro Description */}
        {currentStep === 1 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Let's get you set up.</strong> You can connect your
              YouTube, Spotify, or Facebook accounts to automatically extract
              your preferences (followed channels, artists, creators). This is
              quicker and we won't share your data. Alternatively, you can
              manually add preferences below for more control. You can always
              edit preferences later, and you'll rarely need to update them—set
              it once and you're done.
            </p>
          </div>
        )}

        {/* Step 1: Preferences */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Section 1: Connect with Social Accounts */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                1. Connect with Social Accounts
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Connect your accounts to automatically extract preferences from
                your activity.
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
                  <div>
                    {youtubeConnected ? (
                      <span className="text-sm text-green-600 font-medium">
                        ✓ Connected
                      </span>
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
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                2. Enter or Fine-tune Preferences
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Add your interests, genres, and preferences. If you connected
                social accounts, these may already be populated.
              </p>

              {loadingPreferences ? (
                <div className="text-center py-8">Loading preferences...</div>
              ) : (
                <>
                  <div className="mb-6">
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Your City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="e.g., New York, NY"
                      required
                    />
                  </div>

                  {categories.map((category) => (
                    <div key={category.key} className="mb-6">
                      <h3 className="font-semibold mb-2">{category.label}</h3>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newItem[category.key] || ""}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              [category.key]: e.target.value,
                            })
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addPreferenceItem(category.key);
                            }
                          }}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                          placeholder={category.placeholder}
                        />
                        <button
                          onClick={() => addPreferenceItem(category.key)}
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
                              onClick={() =>
                                removePreferenceItem(category.key, index)
                              }
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
                </>
              )}
            </div>

            {/* Section 3: Enter Links for Event Postings */}
            <div className="bg-white shadow rounded-lg p-6">
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
                <p className="text-gray-400 text-sm">
                  No event sources added yet
                </p>
              )}
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSavePreferencesAndContinue}
                disabled={!city}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                Continue to Preview →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Newsletter Preview */}
        {currentStep === 2 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">
              Step 2: Preview Your Newsletter
            </h2>
            <p className="text-gray-600 mb-6">
              Generate a sample newsletter to see what kind of events we'll find
              for you.
            </p>

            {!newsletter ? (
              <div className="text-center py-8">
                <button
                  onClick={handleGenerateNewsletter}
                  disabled={generating}
                  className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Newsletter Preview"}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">
                    Events Found ({newsletter.events.length}):
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {newsletter.events.map(({ event }) => (
                      <div
                        key={event.id}
                        className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded"
                      >
                        <h4 className="font-medium text-gray-900">
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          <span>
                            📅 {new Date(event.date).toLocaleDateString()}
                          </span>
                          {event.time && (
                            <span className="ml-4">🕐 {event.time}</span>
                          )}
                          <span className="ml-4">📍 {event.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleComplete}
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Complete Setup ✓
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

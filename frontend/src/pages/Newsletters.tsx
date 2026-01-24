import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import LoadingOverlay from "../components/LoadingOverlay";
import api from "../lib/api";

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
  sentAt?: string;
  createdAt: string;
  events: Array<{ event: Event }>;
}

export default function Newsletters() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDumpModal, setShowDumpModal] = useState(false);
  const [rawResponses, setRawResponses] = useState<string[]>([]);

  useEffect(() => {
    loadNewsletters();
  }, []);

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
      
      setSuccess("Newsletter generated!");
      await loadNewsletters();
      
      // If showDump is enabled and we have raw responses, show modal
      if (showDump && response.data.rawResponses) {
        setRawResponses(response.data.rawResponses);
        setShowDumpModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate newsletter");
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
      setSuccess("Newsletter sent!");
      await loadNewsletters();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send newsletter");
    } finally {
      setSending(null);
    }
  };

  return (
    <Layout>
      <LoadingOverlay isVisible={generating} />
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Newsletters
            </h1>
            <p className="text-gray-600">
              Generate and send personalized event newsletters.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Newsletter"}
          </button>
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

        {newsletters.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500">
              No newsletters yet. Generate one to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {newsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="bg-white shadow rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {newsletter.subject}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(newsletter.createdAt).toLocaleString()}
                      {newsletter.sentAt && (
                        <>
                          {" "}
                          • Sent: {new Date(newsletter.sentAt).toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSend(newsletter.id)}
                    disabled={sending === newsletter.id}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {sending === newsletter.id
                      ? "Sending..."
                      : newsletter.sentAt
                      ? "Resend"
                      : "Send"}
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">
                    Events ({newsletter.events.length}):
                  </h3>
                  <div className="space-y-3">
                    {newsletter.events.map(({ event }) => {
                      const score =
                        event.score !== null && event.score !== undefined
                          ? event.score
                          : null;
                      const scoreColor =
                        score !== null
                          ? score >= 80
                            ? "bg-green-500"
                            : score >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                          : "bg-gray-500";
                      const scoreLabel =
                        score !== null
                          ? score >= 80
                            ? "(Excellent match)"
                            : score >= 60
                            ? "(Good match)"
                            : "(Fair match)"
                          : "";

                      return (
                        <div
                          key={event.id}
                          className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-gray-900 flex-1">
                              {event.title}
                            </h4>
                            {score !== null && (
                              <span
                                className={`${scoreColor} text-white text-xs font-bold px-2 py-1 rounded-full ml-2 whitespace-nowrap`}
                              >
                                {score}/100
                              </span>
                            )}
                          </div>
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
                            {event.category && (
                              <span className="ml-4">🏷️ {event.category}</span>
                            )}
                            {score !== null && (
                              <span className="ml-4 text-xs">
                                ⭐ Relevance: {score}/100 {scoreLabel}
                              </span>
                            )}
                          </div>
                          <a
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-500 mt-2 inline-block"
                          >
                            Learn more →
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw AI Response Modal */}
      {showDumpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Raw AI Response
              </h2>
              <button
                onClick={() => setShowDumpModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {rawResponses.map((response, index) => (
                <div key={index} className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    Response {index + 1}:
                  </h3>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {response}
                  </pre>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowDumpModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

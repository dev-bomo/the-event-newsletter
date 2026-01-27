import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import LoadingOverlay from "../components/LoadingOverlay";
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
      <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
        <Windows98Window title="Newsletters">
          <div className="space-y-4">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-black">
                  Generate and send personalized event newsletters.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="win98-button disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Newsletter"}
              </button>
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
                  No newsletters yet. Generate one to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {newsletters.map((newsletter) => (
                  <Windows98ReadingPane key={newsletter.id}>
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-black">{newsletter.subject}</h3>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-black">
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
                          className="win98-button disabled:opacity-50"
                        >
                          {sending === newsletter.id
                            ? "Sending..."
                            : newsletter.sentAt
                            ? "Resend"
                            : "Send"}
                        </button>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-black mb-2">
                          Events ({newsletter.events.length}):
                        </h3>
                        <div className="space-y-2">
                          {newsletter.events.map(({ event }) => {
                            const score =
                              event.score !== null && event.score !== undefined
                                ? event.score
                                : null;
                            const scoreColor =
                              score !== null
                                ? score >= 80
                                  ? "bg-[#00ff00]"
                                  : score >= 60
                                  ? "bg-[#ffff00]"
                                  : "bg-[#ff0000]"
                                : "bg-[#808080]";
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
                                className="border-l-2 border-[#000080] pl-2 py-2 bg-[#c0c0c0] border border-[#808080]"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-xs font-bold text-black flex-1">
                                    {event.title}
                                  </h4>
                                  {score !== null && (
                                    <span
                                      className={`${scoreColor} text-black text-xs font-bold px-2 py-0.5 ml-2 whitespace-nowrap border border-black`}
                                    >
                                      {score}/100
                                    </span>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-xs text-black mt-1">
                                    {event.description}
                                  </p>
                                )}
                                <div className="mt-1 text-xs text-black">
                                  <span>
                                    📅 {new Date(event.date).toLocaleDateString()}
                                  </span>
                                  {event.time && (
                                    <span className="ml-3">🕐 {event.time}</span>
                                  )}
                                  <span className="ml-3">📍 {event.location}</span>
                                  {event.category && (
                                    <span className="ml-3">🏷️ {event.category}</span>
                                  )}
                                  {score !== null && (
                                    <span className="ml-3">
                                      ⭐ Relevance: {score}/100 {scoreLabel}
                                    </span>
                                  )}
                                </div>
                                <a
                                  href={event.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#000080] hover:underline mt-2 inline-block font-bold"
                                >
                                  Learn more →
                                </a>
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

      {/* Raw AI Response Modal */}
      {showDumpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh]">
            <Windows98Window title="Raw AI Response" onClose={() => setShowDumpModal(false)}>
              <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                {rawResponses.map((response, index) => (
                  <div key={index} className="mb-3">
                    <h3 className="text-xs font-bold text-black mb-2">
                      Response {index + 1}:
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

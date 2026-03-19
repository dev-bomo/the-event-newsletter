import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Windows98Window from "../components/Windows98Window";
import api from "../lib/api";

export default function Testing() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendTestTemplateEmail = async () => {
    setSending(true);
    setError("");
    setMessage("");
    try {
      await api.post("/newsletters/test-template/send");
      setMessage("Test template email sent to your logged-in account email.");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to send test template email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-3xl mx-auto">
        <Windows98Window title="Testing Tools">
          <div className="p-4 space-y-4 text-xs text-black">
            <p>
              Localhost-only test actions. Use this page to quickly verify UI/test flows.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={sendTestTemplateEmail}
                disabled={sending}
                className="win98-button"
              >
                {sending ? "Sending..." : "Send Test Email Template"}
              </button>
              {message && <p className="text-[#008000]">{message}</p>}
              {error && <p className="text-[#800000]">{error}</p>}
            </div>

            <hr className="border-0 h-px bg-[#808080]" />

            <div className="space-y-2">
              <p className="font-bold">Frontend Test Links</p>
              <div className="flex flex-col gap-2">
                <Link className="text-[#000080] underline" to="/test-loading">
                  Spinner Test Page (/test-loading)
                </Link>
                <Link className="text-[#000080] underline" to="/newsletters?showLoading=1">
                  Spinner Overlay on Newsletters (?showLoading=1)
                </Link>
                <Link
                  className="text-[#000080] underline"
                  to="/newsletters?showSubscriptionSuccess=1"
                >
                  Subscription Success Modal Preview (?showSubscriptionSuccess=1)
                </Link>
                <Link className="text-[#000080] underline" to="/newsletters?showDump=1">
                  Raw AI Dump Toggle (?showDump=1, then click Generate)
                </Link>
                <Link className="text-[#000080] underline" to="/newsletters?testWizard=1">
                  Onboarding Wizard Shortcut (?testWizard=1)
                </Link>
              </div>
            </div>
          </div>
        </Windows98Window>
      </div>
    </Layout>
  );
}

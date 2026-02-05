import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import api from "../lib/api";
import Windows98Window from "../components/Windows98Window";
import Windows98ReadingPane from "../components/Windows98ReadingPane";
import { Link } from "react-router-dom";

interface Hate {
  id: string;
  type: string;
  value: string;
  createdAt: string;
}

export default function MyHates() {
  const { t } = useTranslation();
  const [hates, setHates] = useState<Hate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  useEffect(() => {
    loadHates();
  }, []);

  const loadHates = async () => {
    try {
      const res = await api.get("/hates");
      setHates(res.data);
      setError("");
    } catch {
      setError(t("hates.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError("");
    try {
      await api.delete(`/hates/${id}`);
      await loadHates();
    } catch {
      setError(t("hates.deleteFailed"));
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    setError("");
    try {
      await api.delete("/hates");
      setHates([]);
      setConfirmDeleteAll(false);
    } catch {
      setError(t("hates.deleteFailed"));
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "organizer":
        return t("hates.typeOrganizer");
      case "artist":
        return t("hates.typeArtist");
      case "venue":
        return t("hates.typeVenue");
      default:
        return type;
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-3xl mx-auto">
        <Windows98Window title={t("hates.pageTitle")}>
          <div className="space-y-4">
            <p className="text-xs text-black">
              {t("hates.pageDescription")}
            </p>
            <Link to="/dashboard" className="text-xs font-bold text-[#000080] hover:underline">
              ← {t("common.back")}
            </Link>

            {error && (
              <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-3 py-2 text-xs text-[#800000]">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-xs text-black">{t("common.loading")}</p>
            ) : hates.length === 0 ? (
              <Windows98ReadingPane>
                <p className="text-xs text-black">{t("hates.empty")}</p>
                <Link to="/newsletters" className="text-xs font-bold text-[#000080] hover:underline mt-2 inline-block">
                  {t("hates.goToNewsletters")} →
                </Link>
              </Windows98ReadingPane>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-black">
                    {t("hates.count", { count: hates.length })}
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(true)}
                    className="win98-button text-[#800000] border-[#800000]"
                  >
                    {t("hates.deleteAll")}
                  </button>
                </div>
                <Windows98ReadingPane>
                  <div className="space-y-2">
                    {hates.map((hate) => (
                      <div
                        key={hate.id}
                        className="flex justify-between items-center py-2 border-b border-[#808080] last:border-0"
                      >
                        <div>
                          <span className="text-xs font-bold text-black">
                            {typeLabel(hate.type)}:
                          </span>{" "}
                          <span className="text-xs text-black">{hate.value}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(hate.id)}
                          disabled={deleting === hate.id}
                          className="win98-button text-xs disabled:opacity-50"
                        >
                          {deleting === hate.id ? t("common.loading") : t("common.remove")}
                        </button>
                      </div>
                    ))}
                  </div>
                </Windows98ReadingPane>
              </>
            )}

            {confirmDeleteAll && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] p-4 max-w-md">
                  <p className="text-xs font-bold text-black mb-2">
                    {t("hates.deleteAllConfirmTitle")}
                  </p>
                  <p className="text-xs text-black mb-3">
                    {t("hates.deleteAllConfirmMessage")}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAll(false)}
                      className="win98-button"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAll}
                      className="win98-button bg-[#800000] text-white border-[#800000]"
                    >
                      {t("hates.deleteAll")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Windows98Window>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import Windows98Window from "../components/Windows98Window";
import Windows98ReadingPane from "../components/Windows98ReadingPane";

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    hasPreferences: false,
    newsletters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Check if user has completed onboarding (has city set)
        // If not, redirect to onboarding immediately
        if (!user?.city) {
          navigate("/onboarding");
          return;
        }

        const [preferencesRes, newslettersRes] = await Promise.all([
          api.get("/preferences"),
          api.get("/newsletters"),
        ]);

        const hasPreferences =
          preferencesRes.data.interests?.length > 0 ||
          preferencesRes.data.genres?.length > 0 ||
          preferencesRes.data.eventTypes?.length > 0;

        setStats({
          hasPreferences: hasPreferences,
          newsletters: newslettersRes.data.length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
        <Windows98Window title="Dashboard">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-black mb-2">
                Welcome{user?.name ? `, ${user.name}` : ""}!
              </h1>
              <p className="text-xs text-black mb-6">
                Get started by connecting your social accounts and setting up your
                preferences.
              </p>
            </div>

            {loading ? (
              <div className="text-black text-xs">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <Windows98ReadingPane>
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-xs font-bold text-black">
                        Preferences
                      </div>
                      <div className="text-sm font-bold text-black">
                        {stats.hasPreferences ? "Set" : "Not set"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#808080]">
                    <Link
                      to="/preferences"
                      className="text-xs font-bold text-[#000080] hover:underline"
                    >
                      Manage preferences →
                    </Link>
                  </div>
                </Windows98ReadingPane>

                <Windows98ReadingPane>
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl">📧</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-xs font-bold text-black">
                        Newsletters
                      </div>
                      <div className="text-sm font-bold text-black">
                        {stats.newsletters}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#808080]">
                    <Link
                      to="/newsletters"
                      className="text-xs font-bold text-[#000080] hover:underline"
                    >
                      View newsletters →
                    </Link>
                  </div>
                </Windows98ReadingPane>
              </div>
            )}

            <Windows98ReadingPane>
              <ol className="list-decimal list-inside space-y-2 text-xs text-black">
                <li>
                  <Link
                    to="/preferences"
                    className="text-[#000080] hover:underline font-bold"
                  >
                    Set your preferences
                  </Link>{" "}
                  (interests, genres, venues, artists)
                </li>
                <li>Set your city location</li>
                <li>Start receiving weekly newsletters with local events!</li>
              </ol>
            </Windows98ReadingPane>
          </div>
        </Windows98Window>
      </div>
    </Layout>
  );
}

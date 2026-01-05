import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

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
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-gray-600 mb-8">
            Get started by connecting your social accounts and setting up your
            preferences.
          </p>

          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Preferences
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.hasPreferences ? "Set" : "Not set"}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link
                      to="/preferences"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Manage preferences →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📧</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Newsletters
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.newsletters}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link
                      to="/newsletters"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View newsletters →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>
                <Link
                  to="/preferences"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Connect your social media accounts
                </Link>{" "}
                (YouTube, Spotify, Facebook, Instagram) to automatically extract
                preferences
              </li>
              <li>
                <Link
                  to="/preferences"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Review and edit your preferences
                </Link>
              </li>
              <li>Set your city location</li>
              <li>Start receiving weekly newsletters with local events!</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}

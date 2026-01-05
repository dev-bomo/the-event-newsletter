import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

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
  sentAt?: string;
  createdAt: string;
  events: Array<{ event: Event }>;
}

export default function Newsletters() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadNewsletters();
  }, []);

  const loadNewsletters = async () => {
    try {
      const response = await api.get('/newsletters');
      setNewsletters(response.data);
    } catch (error) {
      console.error('Error loading newsletters:', error);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    setSuccess('');

    try {
      await api.post('/newsletters/generate');
      setSuccess('Newsletter generated!');
      await loadNewsletters();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate newsletter');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (newsletterId: string) => {
    setError('');
    setSending(newsletterId);
    setSuccess('');

    try {
      await api.post(`/newsletters/${newsletterId}/send`);
      setSuccess('Newsletter sent!');
      await loadNewsletters();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send newsletter');
    } finally {
      setSending(null);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Newsletters</h1>
            <p className="text-gray-600">
              Generate and send personalized event newsletters.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Newsletter'}
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
            <p className="text-gray-500">No newsletters yet. Generate one to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {newsletters.map((newsletter) => (
              <div key={newsletter.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{newsletter.subject}</h2>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(newsletter.createdAt).toLocaleString()}
                      {newsletter.sentAt && (
                        <> • Sent: {new Date(newsletter.sentAt).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSend(newsletter.id)}
                    disabled={sending === newsletter.id}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {sending === newsletter.id ? 'Sending...' : newsletter.sentAt ? 'Resend' : 'Send'}
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">
                    Events ({newsletter.events.length}):
                  </h3>
                  <div className="space-y-3">
                    {newsletter.events.map(({ event }, index) => (
                      <div
                        key={event.id}
                        className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded"
                      >
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                          {event.time && <span className="ml-4">🕐 {event.time}</span>}
                          <span className="ml-4">📍 {event.location}</span>
                          {event.category && (
                            <span className="ml-4">🏷️ {event.category}</span>
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
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}


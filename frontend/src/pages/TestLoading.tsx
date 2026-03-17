import Layout from "../components/Layout";
import LoadingOverlay from "../components/LoadingOverlay";

/**
 * Test page: always shows the newsletter-generation loading overlay (spinner + steps).
 * Visit /test-loading to preview the loading UI.
 */
export default function TestLoading() {
  return (
    <Layout>
      <LoadingOverlay isVisible={true} />
      <div className="p-4 text-xs text-black">
        <p>Loading overlay is visible above. Visit /newsletters to leave.</p>
      </div>
    </Layout>
  );
}

import { Head } from "$fresh/runtime.ts";
import ImageUploader from "../islands/ImageUploader.tsx";
import ResultsTable from "../components/ResultsTable.tsx";

export default function Home() {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <>
      <Head>
        <title>Image Alt Text Generator</title>
        <script src="/htmx.min.js"></script>
      </Head>
      <div class="min-h-screen bg-gray-50">
        <header class="bg-white shadow-sm">
          <div class="max-w-6xl mx-auto px-4 py-6">
            <h1 class="text-2xl font-bold text-gray-900">
              Image Alt Text Generator
            </h1>
            <p class="mt-1 text-gray-600">
              Generate SEO-optimized alt text using local AI
            </p>
          </div>
        </header>

        <main class="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Upload Section */}
          <section class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">
              Upload Images
            </h2>
            <ImageUploader />
          </section>

          {/* Export Section */}
          <section class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">
              Export Results
            </h2>
            <form
              class="flex flex-wrap items-end gap-4"
              action="/api/export"
              method="GET"
            >
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  From
                </label>
                <input
                  type="date"
                  name="from"
                  defaultValue={weekAgo}
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="date"
                  name="to"
                  defaultValue={today}
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export CSV
              </button>
            </form>
          </section>

          {/* Results Section */}
          <section>
            <h2 class="text-lg font-semibold text-gray-800 mb-4">
              Recent Results
            </h2>
            <ResultsTable />
          </section>
        </main>
      </div>
    </>
  );
}

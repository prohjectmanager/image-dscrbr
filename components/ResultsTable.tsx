export default function ResultsTable() {
  // HTMX attributes for server-side rendering
  const htmxAttrs = {
    "hx-get": "/api/results",
    "hx-trigger": "load, refresh",
    "hx-swap": "innerHTML",
  };

  return (
    <div
      id="results-table"
      {...htmxAttrs}
      class="bg-white rounded-lg shadow overflow-x-auto"
    >
      <div class="text-center text-gray-500 py-8">
        Loading results...
      </div>
    </div>
  );
}

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { encodeBase64 } from "$std/encoding/base64.ts";

interface AltTextResult {
  id: number;
  thumbnail: number[];
  filename: string;
  alt_text: string;
  char_count: number;
  model: string;
  created_at: string;
}

export default function ResultsTable() {
  const results = useSignal<AltTextResult[]>([]);
  const isLoading = useSignal(true);
  const error = useSignal<string | null>(null);
  const selectedIds = useSignal<Set<number>>(new Set());
  const isDeleting = useSignal(false);

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/results");
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }
      const data = await response.json();
      results.value = data.results || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      isLoading.value = false;
    }
  };

  useEffect(() => {
    fetchResults();

    const handleRefresh = () => fetchResults();
    globalThis.addEventListener("refresh-results", handleRefresh);

    return () => {
      globalThis.removeEventListener("refresh-results", handleRefresh);
    };
  }, []);

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds.value);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedIds.value = newSet;
  };

  const toggleAll = () => {
    if (selectedIds.value.size === results.value.length) {
      selectedIds.value = new Set();
    } else {
      selectedIds.value = new Set(results.value.map((r) => r.id));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.value.size === 0) return;

    const confirmed = confirm(
      `Delete ${selectedIds.value.size} selected record(s)?`,
    );
    if (!confirmed) return;

    isDeleting.value = true;
    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds.value) }),
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      selectedIds.value = new Set();
      await fetchResults();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Delete failed";
    } finally {
      isDeleting.value = false;
    }
  };

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  if (isLoading.value) {
    return (
      <div class="bg-white rounded-lg shadow">
        <div class="text-center text-gray-500 py-8">
          Loading results...
        </div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="bg-white rounded-lg shadow">
        <div class="text-red-600 p-4">
          Error: {error.value}
        </div>
      </div>
    );
  }

  if (results.value.length === 0) {
    return (
      <div class="bg-white rounded-lg shadow">
        <div class="text-center text-gray-500 py-8">
          No results yet. Upload some images to get started.
        </div>
      </div>
    );
  }

  const allSelected = selectedIds.value.size === results.value.length &&
    results.value.length > 0;

  return (
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      {selectedIds.value.size > 0 && (
        <div class="p-4 border-b border-gray-200 flex items-center gap-4">
          <span class="text-sm text-gray-600">
            {selectedIds.value.size} selected
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting.value}
            class="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting.value ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      )}

      <table class="w-full text-left">
        <thead class="bg-gray-100">
          <tr>
            <th class="py-3 px-4 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </th>
            <th class="py-3 px-4 font-semibold text-gray-600">Thumbnail</th>
            <th class="py-3 px-4 font-semibold text-gray-600">Filename</th>
            <th class="py-3 px-4 font-semibold text-gray-600">Alt Text</th>
            <th class="py-3 px-4 font-semibold text-gray-600 text-center">
              Chars
            </th>
            <th class="py-3 px-4 font-semibold text-gray-600">Model</th>
            <th class="py-3 px-4 font-semibold text-gray-600">Created</th>
          </tr>
        </thead>
        <tbody>
          {results.value.map((r) => {
            const thumbnailBase64 = r.thumbnail?.length > 0
              ? encodeBase64(new Uint8Array(r.thumbnail))
              : "";
            const createdDate = new Date(r.created_at).toLocaleString();
            const isSelected = selectedIds.value.has(r.id);

            return (
              <tr
                key={r.id}
                class={`border-b border-gray-200 hover:bg-gray-50 ${
                  isSelected ? "bg-blue-50" : ""
                }`}
              >
                <td class="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(r.id)}
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </td>
                <td class="py-3 px-4">
                  {thumbnailBase64
                    ? (
                      <img
                        src={`data:image/jpeg;base64,${thumbnailBase64}`}
                        alt={r.alt_text}
                        class="w-16 h-16 object-cover rounded"
                      />
                    )
                    : (
                      <div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                </td>
                <td class="py-3 px-4 font-medium text-gray-900">
                  {escapeHtml(r.filename)}
                </td>
                <td class="py-3 px-4 text-gray-700 max-w-md">
                  {escapeHtml(r.alt_text)}
                </td>
                <td class="py-3 px-4 text-center">
                  <span
                    class={r.char_count > 125
                      ? "text-red-600"
                      : "text-green-600"}
                  >
                    {r.char_count}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-500 text-sm">
                  {escapeHtml(r.model)}
                </td>
                <td class="py-3 px-4 text-gray-500 text-sm">{createdDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { Handlers } from "$fresh/server.ts";
import { getResults, type AltTextResult } from "../../db/schema.ts";
import { encodeBase64 } from "$std/encoding/base64.ts";

function renderResultsTable(results: AltTextResult[]): string {
  if (results.length === 0) {
    return `
      <div class="text-center text-gray-500 py-8">
        No results yet. Upload some images to get started.
      </div>
    `;
  }

  const rows = results.map((r) => {
    const thumbnailBase64 = r.thumbnail ? encodeBase64(r.thumbnail) : "";
    const createdDate = new Date(r.created_at).toLocaleString();

    const thumbnailImg = thumbnailBase64
      ? `<img src="data:image/jpeg;base64,${thumbnailBase64}" alt="${escapeHtml(r.alt_text)}" class="w-16 h-16 object-cover rounded" />`
      : `<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No image</div>`;

    return `
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="py-3 px-4">
          ${thumbnailImg}
        </td>
        <td class="py-3 px-4 font-medium text-gray-900">${escapeHtml(r.filename)}</td>
        <td class="py-3 px-4 text-gray-700 max-w-md">${escapeHtml(r.alt_text)}</td>
        <td class="py-3 px-4 text-center">
          <span class="${r.char_count > 125 ? "text-red-600" : "text-green-600"}">${r.char_count}</span>
        </td>
        <td class="py-3 px-4 text-gray-500 text-sm">${escapeHtml(r.model)}</td>
        <td class="py-3 px-4 text-gray-500 text-sm">${createdDate}</td>
      </tr>
    `;
  }).join("");

  return `
    <table class="w-full text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="py-3 px-4 font-semibold text-gray-600">Thumbnail</th>
          <th class="py-3 px-4 font-semibold text-gray-600">Filename</th>
          <th class="py-3 px-4 font-semibold text-gray-600">Alt Text</th>
          <th class="py-3 px-4 font-semibold text-gray-600 text-center">Chars</th>
          <th class="py-3 px-4 font-semibold text-gray-600">Model</th>
          <th class="py-3 px-4 font-semibold text-gray-600">Created</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const handler: Handlers = {
  GET(_req, _ctx) {
    console.log("[/api/results] Fetching results...");
    try {
      const results = getResults(50);
      console.log("[/api/results] Found", results.length, "results");
      const html = renderResultsTable(results);

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[/api/results] Error:", message);
      return new Response(
        `<div class="text-red-600 p-4">Error loading results: ${escapeHtml(message)}</div>`,
        { status: 500, headers: { "Content-Type": "text/html" } },
      );
    }
  },
};

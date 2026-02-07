import { Handlers } from "$fresh/server.ts";
import { type AltTextResult as DbResult, getResults } from "../../db/schema.ts";

interface ApiResult {
  id: number;
  thumbnail: number[];
  filename: string;
  alt_text: string;
  char_count: number;
  model: string;
  created_at: string;
}

export const handler: Handlers = {
  GET(_req, _ctx) {
    console.log("[/api/results] Fetching results...");
    try {
      const results: DbResult[] = getResults(50);
      console.log("[/api/results] Found", results.length, "results");

      // Convert Uint8Array to number array for JSON serialization
      const serializableResults: ApiResult[] = results.map((r) => ({
        id: r.id,
        thumbnail: Array.from(r.thumbnail),
        filename: r.filename,
        alt_text: r.alt_text,
        char_count: r.char_count,
        model: r.model,
        created_at: r.created_at,
      }));

      return new Response(JSON.stringify({ results: serializableResults }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[/api/results] Error:", message);
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};

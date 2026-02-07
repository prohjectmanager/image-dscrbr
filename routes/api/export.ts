import { Handlers } from "$fresh/server.ts";
import { getResultsByDateRange } from "../../db/schema.ts";

function escapeCSV(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const handler: Handlers = {
  GET(req, _ctx) {
    console.log("[/api/export] Export requested");
    try {
      const url = new URL(req.url);
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      console.log("[/api/export] Date range:", from, "to", to);

      if (!from || !to) {
        return new Response(
          JSON.stringify({
            error: "Both 'from' and 'to' date parameters are required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Normalize dates to ISO format for querying
      const fromDate = new Date(from);
      const toDate = new Date(to);

      // Set to end of day for 'to' date
      toDate.setHours(23, 59, 59, 999);

      const results = getResultsByDateRange(
        fromDate.toISOString(),
        toDate.toISOString(),
      );
      console.log("[/api/export] Exporting", results.length, "results");

      // Build CSV
      const headers = [
        "filename",
        "alt_text",
        "char_count",
        "model",
        "created_at",
      ];
      const csvRows = [headers.join(",")];

      for (const r of results) {
        csvRows.push([
          escapeCSV(r.filename),
          escapeCSV(r.alt_text),
          r.char_count.toString(),
          escapeCSV(r.model),
          escapeCSV(r.created_at),
        ].join(","));
      }

      const csv = csvRows.join("\n");
      const filename = `alt-texts-${from}-to-${to}.csv`;

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};

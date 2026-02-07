import { Handlers } from "$fresh/server.ts";
import { deleteResults } from "../../db/schema.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    console.log("[/api/delete] Processing deletion request...");
    try {
      const body = await req.json();
      const ids = body.ids as number[];

      if (!Array.isArray(ids) || ids.length === 0) {
        return new Response(
          JSON.stringify({ error: "ids array is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      console.log("[/api/delete] Deleting", ids.length, "records");
      const deletedCount = deleteResults(ids);
      console.log("[/api/delete] Deleted", deletedCount, "records");

      return new Response(
        JSON.stringify({ success: true, deleted: deletedCount }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[/api/delete] Error:", message);
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};

import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    console.log("[/api/models] Fetching models from Ollama...");
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch models from Ollama" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      const data = await response.json();
      const models = data.models?.map((m: { name: string }) => m.name) || [];
      console.log("[/api/models] Found models:", models);

      return new Response(JSON.stringify({ models }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(
        JSON.stringify({
          error: "Cannot connect to Ollama. Is it running?",
          details: message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};

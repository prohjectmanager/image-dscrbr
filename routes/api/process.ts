import { Handlers } from "$fresh/server.ts";
import { insertResult } from "../../db/schema.ts";
import { encodeBase64 } from "$std/encoding/base64.ts";

const MAX_THUMBNAIL_SIZE = 200;

async function createThumbnail(
  imageData: Uint8Array,
  filename: string,
): Promise<Uint8Array> {
  // Determine file extension from filename
  const ext = filename.toLowerCase().split(".").pop() || "jpg";
  const validExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
    ? ext
    : "jpg";

  const tempInput = await Deno.makeTempFile({ suffix: `.${validExt}` });
  const tempOutput = await Deno.makeTempFile({ suffix: ".jpg" });

  try {
    await Deno.writeFile(tempInput, imageData);

    // Use sips (built into macOS) for resizing
    const cmd = new Deno.Command("sips", {
      args: [
        "-Z",
        MAX_THUMBNAIL_SIZE.toString(), // Resize to fit in box, maintaining aspect ratio
        "--setProperty",
        "formatOptions",
        "80", // JPEG quality
        "-s",
        "format",
        "jpeg",
        tempInput,
        "--out",
        tempOutput,
      ],
      stderr: "piped",
    });

    const result = await cmd.output();
    if (!result.success) {
      console.error("sips error:", new TextDecoder().decode(result.stderr));
      // Return original if resize fails
      return imageData;
    }

    return await Deno.readFile(tempOutput);
  } catch (error) {
    console.error("Thumbnail creation error:", error);
    // Return original if anything fails
    return imageData;
  } finally {
    try {
      await Deno.remove(tempInput);
      await Deno.remove(tempOutput);
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function generateAltText(
  imageBase64: string,
  model: string,
): Promise<string> {
  const prompt =
    "Generate SEO-optimized alt text for this image. Be descriptive but concise. Maximum 125 characters. Return only the alt text, no quotes or explanation.";

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      images: [imageBase64],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  let altText = data.response?.trim() || "No alt text generated";

  // Remove quotes if present
  if (
    (altText.startsWith('"') && altText.endsWith('"')) ||
    (altText.startsWith("'") && altText.endsWith("'"))
  ) {
    altText = altText.slice(1, -1);
  }

  // Truncate if needed
  if (altText.length > 125) {
    altText = altText.slice(0, 122) + "...";
  }

  return altText;
}

export const handler: Handlers = {
  async POST(req, _ctx) {
    console.log("[/api/process] Processing image upload...");
    try {
      const formData = await req.formData();
      const model = formData.get("model") as string;
      console.log("[/api/process] Using model:", model);

      if (!model) {
        return new Response(
          JSON.stringify({ error: "Model is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const files = formData.getAll("images") as File[];
      if (files.length === 0) {
        return new Response(
          JSON.stringify({ error: "No images provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const results = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          console.log("[/api/process] Skipping non-image file:", file.name);
          continue;
        }

        console.log(
          "[/api/process] Processing:",
          file.name,
          `(${(file.size / 1024).toFixed(1)} KB)`,
        );

        const imageData = new Uint8Array(await file.arrayBuffer());
        console.log("[/api/process] Creating thumbnail...");
        const thumbnail = await createThumbnail(imageData, file.name);
        console.log(
          "[/api/process] Thumbnail size:",
          (thumbnail.length / 1024).toFixed(1),
          "KB",
        );

        const imageBase64 = encodeBase64(imageData);
        console.log("[/api/process] Sending to Ollama...");
        const altText = await generateAltText(imageBase64, model);
        console.log("[/api/process] Generated alt text:", altText);

        const result = insertResult(thumbnail, file.name, altText, model);
        console.log("[/api/process] Saved to database, id:", result.id);
        results.push(result);
      }

      console.log(
        "[/api/process] Completed processing",
        results.length,
        "images",
      );
      return new Response(
        JSON.stringify({ success: true, count: results.length }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[/api/process] Error:", message);
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface Model {
  name: string;
}

export default function ImageUploader() {
  const models = useSignal<string[]>([]);
  const selectedModel = useSignal<string>("");
  const files = useSignal<File[]>([]);
  const isLoading = useSignal(false);
  const isDragging = useSignal(false);
  const error = useSignal<string | null>(null);
  const modelsLoading = useSignal(true);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          error.value = data.error;
        } else {
          models.value = data.models || [];
          if (data.models?.length > 0) {
            selectedModel.value = data.models[0];
          }
        }
        modelsLoading.value = false;
      })
      .catch((err) => {
        error.value = "Failed to load models: " + err.message;
        modelsLoading.value = false;
      });
  }, []);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = true;
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
    const droppedFiles = Array.from(e.dataTransfer?.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    files.value = [...files.value, ...droppedFiles];
  };

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    files.value = [...files.value, ...selectedFiles];
    input.value = "";
  };

  const removeFile = (index: number) => {
    files.value = files.value.filter((_, i) => i !== index);
  };

  const handleSubmit = async () => {
    if (files.value.length === 0 || !selectedModel.value) return;

    isLoading.value = true;
    error.value = null;

    const formData = new FormData();
    formData.append("model", selectedModel.value);
    for (const file of files.value) {
      formData.append("images", file);
    }

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Processing failed");
      }

      files.value = [];
      // Trigger HTMX refresh of results
      const resultsDiv = document.getElementById("results-table");
      if (resultsDiv) {
        // @ts-ignore htmx is loaded globally
        htmx.trigger(resultsDiv, "refresh");
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <div class="space-y-6">
      {error.value && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.value}
        </div>
      )}

      {/* Model Selector */}
      <div class="flex items-center gap-4">
        <label class="font-medium text-gray-700">Model:</label>
        {modelsLoading.value
          ? <span class="text-gray-500">Loading models...</span>
          : (
            <select
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedModel.value}
              onChange={(e) =>
                selectedModel.value = (e.target as HTMLSelectElement).value}
            >
              {models.value.length === 0
                ? <option value="">No models available</option>
                : models.value.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
      </div>

      {/* Drop Zone */}
      <div
        class={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging.value
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          onChange={handleFileSelect}
        />
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="mt-2 text-gray-600">
          Drop images here or <span class="text-blue-600">browse</span>
        </p>
        <p class="mt-1 text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
      </div>

      {/* File List */}
      {files.value.length > 0 && (
        <div class="space-y-2">
          <p class="font-medium text-gray-700">
            {files.value.length} file(s) selected
          </p>
          <div class="flex flex-wrap gap-2">
            {files.value.map((file, index) => (
              <div
                key={index}
                class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
              >
                <span class="text-sm text-gray-700 truncate max-w-[200px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  class="text-gray-500 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={files.value.length === 0 || !selectedModel.value ||
          isLoading.value}
        class={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
          files.value.length === 0 || !selectedModel.value || isLoading.value
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading.value
          ? (
            <span class="flex items-center justify-center gap-2">
              <svg
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          )
          : `Process ${files.value.length || ""} Image${files.value.length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

# Image Alt Text Generator

A web application that generates SEO-optimized alt text for images using local
AI models via Ollama.

## Features

- **Batch Image Processing**: Upload multiple images at once via drag-and-drop
  or file picker
- **AI-Powered Alt Text**: Uses local Ollama models (supports vision-capable
  models like gemma3, llava, etc.)
- **Thumbnail Generation**: Automatically creates optimized thumbnails for the
  results table
- **SQLite Database**: Stores all results locally with metadata (filename, alt
  text, character count, model used, timestamp)
- **CSV Export**: Export results by date range
- **Batch Deletion**: Select and delete multiple records at once
- **Real-time Updates**: Results table refreshes automatically after uploads

## Prerequisites

- [Deno](https://deno.land/manual/getting_started/installation) installed
- [Ollama](https://ollama.com) running locally with at least one vision-capable
  model

## Setup

1. **Install Ollama and pull a vision model:**
   ```bash
   ollama pull gemma3:4b
   # or
   ollama pull llava
   ```

2. **Ensure Ollama is running:**
   ```bash
   ollama serve
   ```

3. **Start the application:**
   ```bash
   deno task start
   ```

4. **Open in browser:** Navigate to http://localhost:8000

## Usage

1. **Upload Images:**
   - Drag and drop images or click "browse" to select files
   - Choose a model from the dropdown
   - Click "Process Images"

2. **View Results:**
   - See generated alt text with character counts
   - Green = within SEO limits (≤125 chars)
   - Red = exceeds recommended length

3. **Export Results:**
   - Select date range
   - Click "Export CSV" to download

4. **Delete Records:**
   - Check individual rows or use the header checkbox to select all
   - Click "Delete Selected" and confirm

## Architecture

- **Frontend**: [Fresh](https://fresh.deno.dev/) (Deno + Preact)
- **Database**: SQLite via `@db/sqlite`
- **AI**: [Ollama](https://ollama.com) (local LLM inference)
- **Image Processing**: macOS `sips` command for thumbnail generation

## Project Structure

```
├── islands/           # Interactive Preact components
│   ├── ImageUploader.tsx
│   └── ResultsTable.tsx
├── routes/            # Fresh routes and API handlers
│   ├── api/
│   │   ├── delete.ts
│   │   ├── export.ts
│   │   ├── models.ts
│   │   ├── process.ts
│   │   └── results.ts
│   └── index.tsx
├── db/
│   └── schema.ts      # Database schema and queries
├── data/              # SQLite database (gitignored)
└── static/            # Static assets
```

## Development

Run the linter and type checker:

```bash
deno task check
```

Format code:

```bash
deno fmt
```

## Notes

- Thumbnails are generated using macOS's built-in `sips` tool
- Alt text is limited to 125 characters for SEO best practices
- Images are processed sequentially to avoid overwhelming Ollama
- The application is designed for local use with a single user

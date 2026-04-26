# ✦ AI Note-Taking App

A Notion-style note-taking app built with Angular 17 + Express + MongoDB, powered by AI via OpenRouter.

---

## Demo


https://github.com/user-attachments/assets/f1ddf018-28b7-4531-9cbb-9bab83c72ac1


<video src="demo/output/demo.mp4" controls width="100%"></video>

> *Creates a folder, writes a Markdown note, uses AI summarisation and Q&A, toggles preview.*

---

## Features

| | Feature |
|---|---|
| 📄 | **Pages** — nested pages with icon picker, tags, word count & reading time |
| 📁 | **Folders** — create folders, drag-and-drop pages in/out |
| ✦ | **AI Assistant** — summarise, auto-generate tags, chat about any page |
| 👁 | **Markdown preview** — toggle between edit and rendered preview |
| 💾 | **Auto-save** — 1 s debounce, live "Saving / Saved" indicator |
| 🔍 | **Full-text search** — searches across all page titles and content |
| ⭐ | **Favourites** — pin/unpin pages, shown at the top of the sidebar |
| 🌙 | **Dark / light mode** — persisted theme toggle |
| 📍 | **Location breadcrumb** — shows folder or parent page under the title |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 (standalone components), Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB 7 (Mongoose) |
| AI | OpenRouter — rotates `minimax/minimax-m2.5:free` → `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free` |
| Video | Playwright + ffmpeg (demo recording) |

---

## Getting Started

### 1. MongoDB

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
npm install
# Add your key to .env:
echo "OPEN_ROUTER_API_KEY=sk-or-..." >> .env
node src/server.js        # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npx ng serve              # http://localhost:4200
```

---

## Environment Variables

`backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/notes-app
PORT=3000
NODE_ENV=development
OPEN_ROUTER_API_KEY=sk-or-...
```

---

## API Routes

**Pages** — `/api/pages`

| Method | Path | Description |
|---|---|---|
| GET | `/tree` | Nested page tree (supports `?folderId=`) |
| GET | `/:id` | Single page |
| POST | `/` | Create page |
| PUT | `/:id` | Update page |
| DELETE | `/:id` | Delete page + descendants |
| POST | `/:id/move` | Move page to new parent |
| GET | `/search` | Full-text search |

**Folders** — `/api/folders`

| Method | Path | Description |
|---|---|---|
| GET | `/tree` | Nested folder tree |
| POST | `/` | Create folder |
| PUT | `/:id` | Rename folder |
| DELETE | `/:id` | Delete folder |

**AI** — `/api/ai`

| Method | Path | Description |
|---|---|---|
| POST | `/chat` | Proxies OpenRouter, rotates 3 models round-robin |

---

## AI Model Rotation

Every request to `/api/ai/chat` cycles through:

1. `minimax/minimax-m2.5:free`
2. `google/gemma-4-31b-it:free`
3. `google/gemma-4-26b-a4b-it:free`

Counter resets on server restart. API key never touches the browser.

---

## License

MIT

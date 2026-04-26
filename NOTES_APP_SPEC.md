# Build: Edge-LLM Note-Taking App (MEAN Stack)

## Goal
Build a **dead simple**, file-based note-taking app with client-side AI features using a small Edge LLM (~0.1B–1B params, runs on most computers). No external AI APIs — all inference happens in the browser.

---

## Tech Stack

- **M**ongoDB — note + folder storage
- **E**xpress — REST API
- **A**ngular 17+ (standalone components) — frontend
- **N**ode.js 18+ — runtime
- **Edge LLM** — `@xenova/transformers` (Transformers.js) running ONNX model in browser
- **Tailwind CSS** — styling
- **TypeScript** — everywhere

---

## Core Concept: Files & Folders

The UI mimics a file explorer:
- **Folders** = directories (can be nested)
- **Notes** = files inside folders (or at root)
- Tree sidebar on the left, editor in the middle, AI panel on the right

That's it. Keep it simple.

---

## Features (MVP)

### Must-have
1. **CRUD notes** — create, read, update, delete
2. **CRUD folders** — with nesting support
3. **File-tree sidebar** — expand/collapse folders, click to open notes
4. **Note editor** — plain textarea (markdown-friendly), auto-save on blur (debounced)
5. **Auto word count** + reading time
6. **Edge LLM features** (run locally in browser):
   - Summarize note
   - Generate tags from content
   - Q&A about current note (chat)

### Nice-to-have (skip if rushed)
- Pin / star notes
- Dark mode toggle
- Search (text-based, server-side via MongoDB `$text`)
- Drag-and-drop notes between folders

---

## Project Structure

```
notes-app/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Note.js
│   │   │   └── Folder.js
│   │   ├── routes/
│   │   │   ├── notes.js
│   │   │   └── folders.js
│   │   ├── controllers/
│   │   │   ├── noteController.js
│   │   │   └── folderController.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── folder-tree/
│   │   │   │   ├── note-editor/
│   │   │   │   ├── note-list/
│   │   │   │   └── ai-panel/
│   │   │   ├── services/
│   │   │   │   ├── note.service.ts
│   │   │   │   ├── folder.service.ts
│   │   │   │   └── edge-llm.service.ts
│   │   │   ├── models/
│   │   │   │   └── types.ts
│   │   │   └── app.component.ts
│   │   ├── main.ts
│   │   ├── styles.css
│   │   └── index.html
│   ├── angular.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Database Schemas

### Note
```js
{
  _id: ObjectId,
  title: String,           // required, max 255
  content: String,         // markdown/plain text
  folderId: ObjectId,      // null = root
  tags: [String],
  summary: String,         // LLM-generated, optional
  wordCount: Number,       // auto-computed pre-save
  isPinned: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```
Index: `{ title: 'text', content: 'text' }`, `{ folderId: 1 }`

### Folder
```js
{
  _id: ObjectId,
  name: String,            // required, max 100
  parentId: ObjectId,      // null = root
  createdAt: Date,
  updatedAt: Date
}
```
Index: `{ parentId: 1 }`

---

## API Endpoints

Base URL: `http://localhost:3000/api`

### Notes
| Method | Path | Body / Query | Returns |
|--------|------|--------------|---------|
| GET | `/notes` | `?folderId=xxx` (optional) | List of notes |
| GET | `/notes/:id` | — | Single note |
| POST | `/notes` | `{ title, content?, folderId?, tags? }` | Created note |
| PUT | `/notes/:id` | partial note | Updated note |
| DELETE | `/notes/:id` | — | `{ success: true }` |
| POST | `/notes/:id/move` | `{ folderId }` | Updated note |
| GET | `/notes/search` | `?query=xxx` | Matching notes |

### Folders
| Method | Path | Body / Query | Returns |
|--------|------|--------------|---------|
| GET | `/folders/tree` | — | Nested folder tree |
| GET | `/folders` | `?parentId=xxx` (optional) | Flat list |
| POST | `/folders` | `{ name, parentId? }` | Created folder |
| PUT | `/folders/:id` | `{ name? }` | Updated folder |
| DELETE | `/folders/:id` | `{ moveToParent?: boolean }` | `{ success: true }` |

**Response shape (all endpoints):**
```json
{ "success": true, "data": ... }
```
or
```json
{ "success": false, "error": "..." }
```

---

## Edge LLM — Key Implementation Details

### Library
Use **`@xenova/transformers`** (Transformers.js). It runs ONNX models in the browser via WebAssembly/WebGPU.

```bash
npm install @xenova/transformers
```

### Recommended Model
**`Xenova/Qwen1.5-0.5B-Chat`** — ~500M params, runs on almost any laptop.

Alternatives if too slow:
- `Xenova/distilbart-cnn-6-6` — for summarization only (smaller, faster)
- `Xenova/TinyLlama-1.1B-Chat-v1.0` — slightly bigger, better quality

### Service Outline (`edge-llm.service.ts`)

```typescript
import { pipeline, env } from '@xenova/transformers';

@Injectable({ providedIn: 'root' })
export class EdgeLlmService {
  private generator: any = null;
  private summarizer: any = null;
  ready$ = new BehaviorSubject<boolean>(false);

  async init() {
    // Lazy load on first use
    env.allowLocalModels = false;
    this.generator = await pipeline(
      'text-generation',
      'Xenova/Qwen1.5-0.5B-Chat'
    );
    this.ready$.next(true);
  }

  async summarize(text: string): Promise<string> {
    if (!this.generator) await this.init();
    const prompt = `Summarize in 2 sentences:\n\n${text}\n\nSummary:`;
    const out = await this.generator(prompt, { max_new_tokens: 80 });
    return this.extractAfter(out[0].generated_text, 'Summary:');
  }

  async generateTags(text: string): Promise<string[]> {
    if (!this.generator) await this.init();
    const prompt = `List 5 short tags (comma-separated) for this note:\n${text}\n\nTags:`;
    const out = await this.generator(prompt, { max_new_tokens: 30 });
    const raw = this.extractAfter(out[0].generated_text, 'Tags:');
    return raw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);
  }

  async ask(question: string, context: string): Promise<string> {
    if (!this.generator) await this.init();
    const prompt = `Context:\n${context}\n\nQuestion: ${question}\nAnswer:`;
    const out = await this.generator(prompt, { max_new_tokens: 150 });
    return this.extractAfter(out[0].generated_text, 'Answer:');
  }

  private extractAfter(text: string, marker: string): string {
    const i = text.lastIndexOf(marker);
    return i >= 0 ? text.slice(i + marker.length).trim() : text.trim();
  }
}
```

### UX Notes for LLM
- Show a loading spinner — first inference downloads the model (~500MB cached after).
- Display "Loading model..." progress on first AI action.
- Cache the model in IndexedDB (Transformers.js does this automatically).
- Disable AI buttons while a request is in-flight.
- Surface a one-time "AI runs locally on your device" message so users understand the wait on first run.

---

## Frontend Components

### `<folder-tree>`
- Recursive tree view of folders
- Each folder: click to open, expand arrow, right-click for rename/delete
- "+ New Folder" button at top
- Highlight active folder
- "All Notes" root option

### `<note-list>` (inside main area)
- Lists notes in selected folder
- Each card: title, preview (first 100 chars), updated time, tags
- Click → opens in editor
- "+ New Note" button

### `<note-editor>`
- Title input (large, bold)
- Content textarea (full height, monospace optional)
- Tag chips with add/remove
- Footer: word count + "saved" indicator
- Auto-save on blur, debounced 1s

### `<ai-panel>` (right sidebar)
- Three quick-action buttons: **Summarize**, **Generate Tags**, **Ask Question**
- Chat-style message list for Q&A
- Input box at bottom (only enabled when a note is open)
- Loading state when LLM is working

---

## Setup Instructions (in README)

```bash
# Backend
cd backend
npm install
cp .env.example .env  # set MONGO_URI
npm run dev           # port 3000

# Frontend (new terminal)
cd frontend
npm install
ng serve              # port 4200
```

### `.env.example`
```
MONGO_URI=mongodb://localhost:27017/notes-app
PORT=3000
```

### `docker-compose.yml` (optional)
Spin up MongoDB:
```yaml
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["./data:/data/db"]
```

---

## Build Order (Recommended)

1. **Backend skeleton** — Express server, MongoDB connection, models
2. **Backend CRUD** — notes + folders endpoints, test with curl/Postman
3. **Frontend scaffold** — `ng new`, Tailwind setup, three-pane layout shell
4. **Folder tree + note list** — wire up to backend, no editing yet
5. **Note editor** — full CRUD from UI, auto-save
6. **Edge LLM service** — load model, implement summarize first (simplest)
7. **AI panel UI** — buttons, chat view, wire to LLM service
8. **Polish** — dark mode, loading states, error handling

---

## Constraints & Principles

- **Keep it simple.** No auth, no users, no sharing. Single-user local app.
- **No external AI APIs.** All inference is client-side via Transformers.js.
- **Standalone Angular components.** No NgModules.
- **Thin backend.** Just CRUD — no business logic on the server.
- **Graceful LLM degradation.** If model fails to load, app still works for note-taking; AI features show "unavailable."
- **Mobile-friendly later.** Desktop-first for MVP; responsive is nice-to-have.

---

## Out of Scope (Don't Build)

- User accounts / auth
- Real-time collaboration
- Mobile native app
- Export to PDF/Word
- Cloud sync
- Plugins or extensions

---

## Acceptance Criteria

✅ Can create folders and nest them
✅ Can create notes inside folders or at root
✅ Notes auto-save when I click away
✅ Folder tree updates immediately when I add/rename/delete
✅ Clicking "Summarize" on a note returns a 1–2 sentence summary in <30s on a mid-range laptop
✅ Tags are auto-generated and added to the note
✅ Q&A about a note returns a relevant answer
✅ Model only downloads once (cached in IndexedDB)
✅ Works offline after first model load

---

**Start with the backend, get CRUD working end-to-end, then layer the LLM in last.**

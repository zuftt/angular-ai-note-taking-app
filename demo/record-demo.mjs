import pkg from '/Users/muhdzafri/slm-ai-note-taking-app/frontend/node_modules/playwright/index.js';
const { chromium } = pkg;
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

const OUT_DIR = '/Users/muhdzafri/slm-ai-note-taking-app/demo/output';
const VIDEO_DIR = `${OUT_DIR}/raw`;
mkdirSync(VIDEO_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function typeSlowly(locator, text, delay = 55) {
  for (const char of text) {
    await locator.pressSequentially(char, { delay });
  }
}

console.log('🎬  Launching browser...');

const browser = await chromium.launch({
  headless: false,
  args: ['--window-size=1280,800', '--disable-blink-features=AutomationControlled'],
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 800 } },
  locale: 'en-US',
});

const page = await context.newPage();

// ── 1. Land on app ──────────────────────────────────────────────────────────
await page.goto('http://localhost:4200');
await sleep(1800);

// Dismiss onboarding modal if visible
const modal = page.locator('.modal');
if (await modal.isVisible()) {
  await sleep(1200);
  await page.locator('.btn-primary').click();
  await sleep(600);
}

// ── 2. Create a folder ──────────────────────────────────────────────────────
console.log('📁  Creating folder...');
await page.locator('.section-add-btn').click();
await sleep(400);
await typeSlowly(page.locator('.folder-create-input'), 'Work Projects');
await page.keyboard.press('Enter');
await sleep(800);

// ── 3. Create a page inside the folder ─────────────────────────────────────
console.log('📄  Adding page to folder...');
await page.locator('.folder-row').first().click(); // expand
await sleep(500);
// click the + button inside the folder row
await page.locator('.folder-row .action-btn').first().click();
await sleep(1200);

// ── 4. Type a title ─────────────────────────────────────────────────────────
console.log('✏️   Typing title...');
const titleInput = page.locator('.page-title');
await titleInput.click();
await titleInput.fill('');
await typeSlowly(titleInput, 'Q2 Product Roadmap');
await sleep(600);

// ── 5. Type markdown content ────────────────────────────────────────────────
console.log('📝  Typing markdown content...');
const contentArea = page.locator('.content-area');
await contentArea.click();
const content = `## Overview
Building the next generation note-taking experience powered by AI.

## Key Features
- **AI Summarization** — one-click note summaries
- **Auto Tags** — AI-generated tags from content
- **Folder Organisation** — drag pages into folders
- **Markdown Support** — full preview mode

## Timeline
| Quarter | Goal |
|---------|------|
| Q2 2026 | MVP launch |
| Q3 2026 | Mobile app |

> "The best notes app is the one you actually use."
`;
await typeSlowly(contentArea, content, 18);
await sleep(1200);

// ── 6. Show auto-save ───────────────────────────────────────────────────────
console.log('💾  Showing auto-save...');
await sleep(1500); // let the save indicator appear

// ── 7. Toggle markdown preview ──────────────────────────────────────────────
console.log('👁   Toggling preview...');
await page.locator('.preview-toggle').click();
await sleep(2000);

// scroll down to show the table
await page.locator('.markdown-preview').evaluate(el => el.scrollBy(0, 120));
await sleep(1200);

// back to edit
await page.locator('.preview-toggle').click();
await sleep(800);

// ── 8. Open AI panel ────────────────────────────────────────────────────────
console.log('✦   Opening AI panel...');
await page.locator('.ai-toggle').click();
await sleep(1000);

// ── 9. Summarize ────────────────────────────────────────────────────────────
console.log('✨  Summarizing...');
await page.locator('.action-card').first().click();
await sleep(6000); // wait for AI response

// ── 10. Ask a question ──────────────────────────────────────────────────────
console.log('💬  Asking AI a question...');
const chatInput = page.locator('.chat-input');
await chatInput.click();
await typeSlowly(chatInput, 'When is the mobile app planned?');
await page.keyboard.press('Enter');
await sleep(6000);

// ── 11. Close AI panel and show sidebar ─────────────────────────────────────
await page.locator('.close-btn').click();
await sleep(800);

// ── 12. Create a second root page to show pinning ───────────────────────────
console.log('📌  Creating second page...');
await page.locator('.add-page-btn').click();
await sleep(1000);

const title2 = page.locator('.page-title');
await title2.click();
await title2.fill('');
await typeSlowly(title2, 'Meeting Notes');
await sleep(500);

// ── 13. Drag page to folder (demonstrate DnD) ───────────────────────────────
// Instead of complex drag, just show the sidebar structure nicely
await sleep(1200);

// ── 14. Pause on final state ────────────────────────────────────────────────
console.log('🎬  Holding final frame...');
await sleep(3000);

// ── Done ────────────────────────────────────────────────────────────────────
await context.close();
await browser.close();

console.log('✅  Browser closed. Rendering MP4...');

// ffmpeg: convert webm → polished mp4
const webm = execSync(`ls ${VIDEO_DIR}/*.webm`).toString().trim();
const mp4 = `${OUT_DIR}/demo.mp4`;

execSync(
  `ffmpeg -y -i "${webm}" \
    -vf "scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2" \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
    -movflags +faststart \
    "${mp4}"`,
  { stdio: 'inherit' }
);

console.log(`\n🎉  Done! Video saved to:\n    ${mp4}\n`);

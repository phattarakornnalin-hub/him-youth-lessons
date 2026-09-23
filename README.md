# HIM Youth Thailand — Lesson Library

A plain static website for storing and browsing discipleship lessons. No server,
no database — just HTML/CSS/JS and Markdown files. Works from any static host
(GitHub Pages, Netlify, Vercel, or even a shared folder opened locally).

## How it works

- `lessons/manifest.json` is the index: one entry per lesson (title, category,
  date, short excerpt, and the filename of its content).
- Each lesson's full content lives in its own `.md` (Markdown) file inside
  `lessons/`.
- `index.html` / `style.css` / `app.js` load the manifest, show the list with
  search + category filters, and render a lesson's Markdown when clicked.

There's no size limit that matters in practice — this scales to hundreds of
lesson files without any change to the site itself.

## Adding a new lesson

1. Write the lesson in a new file, e.g. `lessons/0004-my-new-lesson.md`.
   Plain Markdown: `#`/`##` for headings, `-` for bullet lists, `>` for a
   quote, blank lines between paragraphs.
2. Add one entry to `lessons/manifest.json`:
   ```json
   {
     "id": "0004-my-new-lesson",
     "title": "ชื่อบทเรียน",
     "category": "หมวดที่ต้องการ",
     "date": "2026-10-01",
     "excerpt": "สรุปสั้น ๆ หนึ่งประโยค",
     "file": "0004-my-new-lesson.md"
   }
   ```
   `id` should be unique and URL-safe (letters, numbers, hyphens) — it becomes
   the link to that lesson. `category` can be a new one; it will appear
   automatically in the filter bar.
3. Save and redeploy (see below). That's the whole workflow — no build step.

## Editing or removing a lesson

Edit the `.md` file directly, or remove both the `.md` file and its manifest
entry to take a lesson down.

## Trying it locally

Opening `index.html` directly by double-clicking it won't work in every
browser (fetching local JSON/Markdown files is blocked by some browsers'
security rules). Instead, run a tiny local server from this folder:

```bash
python3 -m http.server 8000
```

then open `http://localhost:8000` in a browser.

## Deploying for free

Any of these work well for a low-traffic site like this one:

- **GitHub Pages** — push this folder to a GitHub repo, then enable Pages
  in the repo's Settings (Pages → Deploy from branch). Free, and updates
  automatically whenever you push a new lesson.
- **Netlify / Vercel** — drag and drop this folder into their web dashboard
  ("Deploy manually" / drag-and-drop deploy). Free tier is enough.
- **Any shared web hosting** — upload the whole folder via FTP; it's plain
  static files, so nothing else is required.

## Notes

- The three lessons included (`0001`–`0003`) are placeholder content —
  replace or delete them.
- Fonts (Noto Serif Thai, Sarabun) and the Markdown renderer (marked.js)
  load from public CDNs, so the site needs an internet connection to look
  and render correctly.

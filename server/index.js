import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const PHOTOS_DIR = process.env.PHOTOS_DIR || '/photos';
const MIN_PHOTOS = 8;
const MAX_PHOTOS = 50;
const CACHE_TTL = 30_000;

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif',
]);

let photoCache = { files: [], mtime: 0, expires: 0 };

function walkDirectory(dir) {
  const photos = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        photos.push(...walkDirectory(full));
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (IMAGE_EXTENSIONS.has(ext)) {
          const relDir = path.relative(PHOTOS_DIR, dir);
          const urlPath = relDir
            ? relDir.replace(/\\/g, '/') + '/' + e.name
            : e.name;
          photos.push({
            name: e.name,
            url: '/photos/' + urlPath.split('/').map(encodeURIComponent).join('/'),
          });
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err.message);
  }
  return photos;
}

function getPhotos() {
  const now = Date.now();
  if (now < photoCache.expires && photoCache.files.length > 0) {
    return photoCache.files;
  }

  try {
    const stat = fs.statSync(PHOTOS_DIR);
    if (stat.mtimeMs <= photoCache.mtime && now < photoCache.expires + 60_000) {
      return photoCache.files;
    }
    const files = walkDirectory(PHOTOS_DIR);
    photoCache = { files, mtime: stat.mtimeMs, expires: now + CACHE_TTL };
    return files;
  } catch {
    return [];
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fillPhotos(arr, min) {
  if (arr.length === 0) return [];
  const result = shuffle(arr);
  while (result.length < min) {
    result.push(...shuffle(arr));
  }
  return result;
}

// Partial shuffle - only shuffle first n elements for efficiency
function partialShuffle(arr, n) {
  const a = [...arr];
  const len = a.length;
  for (let i = 0; i < Math.min(n, len); i++) {
    const j = i + Math.floor(Math.random() * (len - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// API endpoint - supports pagination
app.get('/api/photos', (req, res) => {
  const photos = getPhotos();
  const total = photos.length;

  // Parse pagination params
  const limit = Math.min(parseInt(req.query.limit) || MAX_PHOTOS, MAX_PHOTOS);
  const offset = parseInt(req.query.offset) || 0;

  // Efficient partial shuffle - only shuffle what we need
  const shuffled = partialShuffle(photos, offset + limit);
  const result = shuffled.slice(offset);

  // Fill if needed
  const filled = fillPhotos(result, MIN_PHOTOS);

  res.json({
    photos: filled,
    total,
    limit: filled.length,
    offset,
    hasMore: offset + filled.length < total
  });
});

// Serve photos directory
app.use('/photos', express.static(PHOTOS_DIR, { index: false }));

// Serve frontend
const publicDir = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`Photo wall running on http://localhost:${PORT}`);
  console.log(`Scanning photos from: ${PHOTOS_DIR}`);
});

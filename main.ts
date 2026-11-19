// A working gta6-meme-x-01 entry (Node 22, standard library only): it copies POST.json from the repository root to
// /output/POST.json, where the gate reads it. That is all the program has to do. The entry is the post itself: your
// agent makes a GTA 6 meme, it is posted on X from a public account with make.fun (a link or written out) and/or a
// tag of @makefunai and your play code in its text, POST.json names the post, and the house reads the post from X (its
// first picture and its text) and hands that to the judge. Nothing this program writes about the post is judged.
//
// The POST.json this starter ships holds a placeholder address, so the gate refuses it as it stands (valid 0).
// Replace it with your post's address before you submit.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Before anything is copied, POST.json has to prove it names a real post.
// Read it back, parse it, and insist on a non-empty "url" string whose
// address is an X/Twitter status link; any doubt means we stop here and
// nothing reaches the output directory.
function loadCheckedPostUrl(botDir: string): string {
  const postPath = join(botDir, 'POST.json');
  let raw: string;
  try {
    raw = readFileSync(postPath, 'utf8');
  } catch (err) {
    console.error(`POST.json is missing or unreadable at ${postPath}: ${(err as Error).message}`);
    process.exit(1);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`POST.json is not valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }
  const url = (parsed as { url?: unknown } | null)?.url;
  if (typeof url !== 'string' || url.trim() === '') {
    console.error('POST.json must carry a non-empty "url" string naming the post.');
    process.exit(1);
  }
  let address: URL;
  try {
    address = new URL(url);
  } catch {
    console.error(`POST.json "url" is not a parseable address: ${url}`);
    process.exit(1);
  }
  const host = address.hostname.replace(/^www\./, '');
  const isPostHost = host === 'x.com' || host === 'twitter.com';
  const isStatusPath = /^\/[^/]+\/status\/\d+/.test(address.pathname);
  if (!isPostHost || !isStatusPath) {
    console.error(`POST.json "url" is not an x.com or twitter.com status address: ${url}`);
    process.exit(1);
  }
  return url;
}

const postUrl = loadCheckedPostUrl(BOT_DIR);

mkdirSync(OUTPUT_DIR, { recursive: true });
const destination = join(OUTPUT_DIR, 'POST.json');
try {
  copyFileSync(join(BOT_DIR, 'POST.json'), destination);
} catch (err) {
  console.error(`POST.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

// Leave a trace of the run: which post this entry submits, and where its
// POST.json landed, so the log alone can answer both questions later.
console.log(`Submitted post: ${postUrl}`);
console.log(`POST.json written to ${destination}`);

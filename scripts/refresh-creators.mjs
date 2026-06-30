/**
 * VANTRA COLLECTIVE — Creator Data Refresh Script
 *
 * Fetches real follower counts from platform APIs and regenerates
 * src/creators-data.js. Designed to run in GitHub Actions on the
 * 1st of every month, but can also be run locally:
 *
 *   YOUTUBE_API_KEY=your_key node scripts/refresh-creators.mjs
 *
 * Platform support:
 *   YouTube  → YouTube Data API v3 (free, requires YOUTUBE_API_KEY)
 *   TikTok   → Multiple unofficial sources with validation & fallback
 *   Instagram → Not supported without Meta Business auth — kept static in config
 */

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, '..');
const CONFIG_PATH = join(__dirname, 'creators-config.json');
const OUTPUT_PATH = join(ROOT, 'src', 'creators-data.js');

const YT_KEY = process.env.YOUTUBE_API_KEY;

// Vantra showcases micro/mid-tier creators only — keep within this range
const MIN_FOLLOWER_THRESHOLD = 10_000;
const MAX_FOLLOWER_THRESHOLD = 500_000;

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
  const num = parseInt(n, 10);
  if (isNaN(num) || num < MIN_FOLLOWER_THRESHOLD || num > MAX_FOLLOWER_THRESHOLD) return null; // out of micro/mid-tier range
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1);
    return (val.endsWith('.0') ? val.slice(0, -2) : val) + 'M';
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1);
    return (val.endsWith('.0') ? val.slice(0, -2) : val) + 'K';
  }
  return String(num);
}

function monthLabel() {
  return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

async function safeFetch(url, opts = {}, timeout = 10000) {
  try {
    const res = await fetch(url, {
      ...opts,
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchYouTubeFollowers(channelId) {
  if (!YT_KEY) {
    console.warn('  ⚠  YOUTUBE_API_KEY not set — skipping YouTube fetch');
    return null;
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YT_KEY}`;
    const res  = await safeFetch(url);
    if (!res) throw new Error('request failed');
    const data = await res.json();
    const subs = data.items?.[0]?.statistics?.subscriberCount;
    return fmt(subs);
  } catch (err) {
    console.warn('  ⚠  YouTube API error:', err.message);
    return null;
  }
}

async function fetchTikTokFollowers(username) {
  // Strategy 1: countik.com — free, no auth, but validates the result
  const countikRes = await safeFetch(
    `https://www.countik.com/api/userinfo?username=${username}`,
    { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
  );
  if (countikRes) {
    try {
      const data  = await countikRes.json();
      const count = data?.follower_count;
      const result = fmt(count);
      if (result) return result;
    } catch { /* try next */ }
  }

  // Strategy 2: parse follower count from TikTok's page __NEXT_DATA__
  const pageRes = await safeFetch(
    `https://www.tiktok.com/@${username}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      }
    },
    14000
  );
  if (pageRes) {
    try {
      const html = await pageRes.text();
      // TikTok embeds stats in a SIGI_STATE or __NEXT_DATA__ JSON blob
      const patterns = [
        /"followerCount"\s*:\s*(\d+)/,
        /"fans"\s*:\s*(\d+)/,
        /"follower_count"\s*:\s*(\d+)/,
      ];
      for (const pattern of patterns) {
        const m = html.match(pattern);
        if (m) {
          const result = fmt(m[1]);
          if (result) return result;
        }
      }
    } catch { /* fall through */ }
  }

  console.warn(`  ⚠  Could not fetch TikTok followers for @${username} — keeping existing value`);
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔄  Refreshing creator data for', monthLabel());

  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  const results = [];

  for (const creator of config) {
    process.stdout.write(`  Fetching ${creator.handle}… `);

    let followers = null;

    if (creator.youtubeChannelId) {
      followers = await fetchYouTubeFollowers(creator.youtubeChannelId);
    } else if (creator.tiktokUsername) {
      followers = await fetchTikTokFollowers(creator.tiktokUsername);
    } else if (creator.instagramUsername) {
      // Instagram requires Meta Business API — skip, use config fallback
      console.log('(Instagram — using static value)');
    }

    if (followers) {
      console.log(`${followers} ✓`);
    } else {
      // Fall back to the value stored in config (manually kept accurate)
      followers = creator.followers ?? '—';
      console.log(`kept existing (${followers})`);
    }

    results.push({ ...creator, followers });
  }

  // Serialize back to JS module
  const entries = results.map(c => {
    const featLine = c.featured ? `    featured:   true,\n` : '';
    return [
      '  {',
      featLine + `    handle:     ${JSON.stringify(c.handle)},`,
      `    name:       ${JSON.stringify(c.name)},`,
      `    category:   ${JSON.stringify(c.category)},`,
      `    platform:   ${JSON.stringify(c.platform)},`,
      `    followers:  ${JSON.stringify(c.followers)},`,
      `    engagement: ${JSON.stringify(c.engagement)},`,
      `    tags:       ${JSON.stringify(c.tags)},`,
      `    verified:   ${c.verified},`,
      `    accent:     ${JSON.stringify(c.accent)},`,
      '  }',
    ].join('\n');
  });

  const output = `/**
 * VANTRA COLLECTIVE — TRENDING CREATORS ROSTER
 * Auto-generated by scripts/refresh-creators.mjs — do not edit by hand.
 * To change creators or static fields, edit scripts/creators-config.json.
 * Last refreshed: ${new Date().toISOString()}
 */

export const LAST_UPDATED = '${monthLabel()}';

export const TRENDING_CREATORS = [
${entries.join(',\n\n')}
];
`;

  await writeFile(OUTPUT_PATH, output, 'utf8');
  console.log(`\n✅  src/creators-data.js updated  (${monthLabel()})`);
}

main().catch(err => {
  console.error('❌  Refresh failed:', err);
  process.exit(1);
});

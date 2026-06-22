## Goal

Get AI scanning working again for free, for your 1-user app.

## Why it's broken right now

The edge function logs show Google is returning `limit: 0` for `gemini-2.0-flash` on your current key. That means the Google Cloud project that owns your `GEMINI_API_KEY` has **no free-tier quota at all** — usually because the project was created with billing required, or quota was disabled. Retrying won't help. The "TOO MANY SCANS" message is misleading; it's really "this key has zero quota".

A brand-new key from a fresh Google AI Studio account/project gets the standard free tier, which is **plenty for 1 user**:
- Gemini 2.0 Flash free tier: ~15 requests/minute, 1,500 requests/day, 1M tokens/minute
- No credit card required
- No billing enabled

So yes — swapping in a new key will fix it, at $0.

## Plan

### Step 1 — You generate a new Gemini key (free, ~1 minute)
1. Go to https://aistudio.google.com/apikey
2. Sign in with a Google account (a personal Gmail is fine — does NOT need to be the same one tied to the broken key)
3. Click **Create API key** → choose **Create API key in new project** (important — a new project guarantees fresh free-tier quota)
4. Copy the key (starts with `AIza...`)

### Step 2 — I update the `GEMINI_API_KEY` secret
I'll trigger the secret-update form so you can paste the new key securely. The edge function picks it up automatically — no redeploy needed.

### Step 3 — I improve the error messages in the edge function
Right now any 429 from Google becomes "Too many scans — try again in a minute", even when the real problem is "key has no quota". I'll:
- Detect `RESOURCE_EXHAUSTED` with `limit: 0` and return a distinct error: "AI key has no quota — generate a new key at aistudio.google.com"
- Keep the existing "rate limited, try again" message only for real per-minute bursts
- Update `src/lib/scan.ts` to surface those messages cleanly

That's it — frontend UI stays untouched, no new dependencies, no cost.

## Files to change

- `supabase/functions/scan-food/index.ts` — parse Gemini's 429 body, split "no quota" vs "rate limited"
- `src/lib/scan.ts` — pass through the server's error message instead of overriding on 429

## What you should NOT do

- Don't enable billing on the broken Google Cloud project — not needed for 1 user
- Don't switch to a different provider — Gemini free tier covers your usage easily

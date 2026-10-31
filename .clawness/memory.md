# Project lessons (Clawness memory)
<!-- Clawness retrieves from this file each prompt: `## Always` entries are
     injected every turn (keep to 3), `## Lessons` entries only when they match
     the prompt. Tell Claude "remember this: ..." or append a bullet yourself
     (one line, <=120 chars, newest at the bottom). Only lessons that would cost
     real rework if forgotten belong here — not a session log. See ENF-MEM-001. -->

## Always

## Lessons
- Stopping `npm run dev` (concurrently) can orphan node on :3000/:8787; kill by port before restarting.
- Headless Edge --window-size below ~492px still lays out at 492 and crops the PNG; fake overflow, not a bug.
- Never start a 2nd `next dev` here: it shares .next and 404s the running server's CSS/JS; check :3000/:8787 first.
- Product is Orbit, a commercial product by Quantrix Studio (quantrix.studio); not self-hosted/open source.

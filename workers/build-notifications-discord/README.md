# build-notifications-discord

Cloudflare Queue consumer Worker: receives build events (Event Subscriptions) and posts to Discord.

## Prerequisites

- Queue **pages-build-discord** created (`npx wrangler queues create pages-build-discord` or via dashboard)
- In dashboard: **Queues** → **+ Subscribe to events** → select **Workers Builds** → target queue **pages-build-discord**

## Deploy

```bash
cd workers/build-notifications-discord
npx wrangler secret put DISCORD_WEBHOOK_URL   # paste webhook URL when prompted
npx wrangler deploy
```

## Note

Workers Builds events are for **Workers** builds. Cloudflare **Pages** builds do not emit these events; for Pages use the GitHub Actions workflow (Pages API poll → Discord) instead.

/**
 * Consumes build events from Cloudflare Queue (Event Subscriptions) and posts to Discord.
 * Supports Workers Builds event format: type, source, payload, metadata.
 */

export default {
  async queue(batch, env, ctx) {
    const webhookUrl = env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL not set');
      return;
    }
    for (const message of batch.messages) {
      try {
        const body = message.body;
        const data = typeof body === 'string' ? JSON.parse(body) : body;
        const payload = buildDiscordPayload(data);
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) message.ack();
        else message.retry();
      } catch (e) {
        console.error(e);
        message.retry();
      }
    }
  },
  // Temporary fetch handler for testing
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === '/test') {
       const mockData = {
        type: "test",
        payload: {
          project: { name: "Test Project" },
          deployment: { url: "https://example.com" },
          buildOutcome: "success",
          files: { count: 123 },
          size: 1024
        }
      };
      
      // Simulate queue batch
      const mockBatch = {
        messages: [{
          body: JSON.stringify(mockData),
          ack: () => console.log('Acked'),
          retry: () => console.log('Retried')
        }]
      };

      await this.queue(mockBatch, env, ctx);
      return new Response("Test message sent to Discord!");
    }
    return new Response("Worker is running. Go to /test to trigger a notification.");
  },
};

function buildDiscordPayload(data) {
  // Event Subscriptions format: { type, source, payload, metadata }
  const eventType = data?.type ?? '';
  const payload = data?.payload ?? data;
  const meta = data?.payload?.buildTriggerMetadata ?? payload?.buildTriggerMetadata ?? {};
  const outcome = data?.payload?.buildOutcome ?? payload?.buildOutcome ?? payload?.status ?? 'unknown';
  const workerName = data?.source?.workerName ?? payload?.project?.name ?? 'Build';

  const isSuccess = outcome === 'success';
  const isFailed = outcome === 'failure' || outcome === 'fail';
  const isCancelled = outcome === 'canceled' || outcome === 'cancelled';

  let color = 0x5865f2;
  if (isSuccess) color = 0x57f287;
  else if (isFailed) color = 0xed4245;
  else if (isCancelled) color = 0xfee75c;

  const branch = meta.branch ?? payload?.branch ?? '—';
  const commit = (meta.commitHash ?? payload?.commit?.sha ?? payload?.sha ?? '').slice(0, 7);
  const author = meta.author ?? payload?.author ?? '—';
  const commitMsg = meta.commitMessage ?? payload?.commit_message ?? '';

  let title = 'Deploy Finished';
  if (eventType.includes('build.failed')) title = 'Build Failed';
  else if (eventType.includes('build.canceled')) title = 'Build Cancelled';
  else if (eventType.includes('build.started')) title = 'Build Started';
  else if (isFailed) title = 'Build Failed';
  else if (isCancelled) title = 'Build Cancelled';

  let desc = `**Project:** ${workerName}\n**Branch:** ${branch}\n**Commit:** \`${commit || '—'}\`\n**Author:** ${author}`;
  if (commitMsg) desc += `\n**Message:** ${commitMsg}`;
  const errMsg = payload?.error?.message ?? payload?.message ?? payload?.error;
  if (errMsg) desc += `\n**Error:** ${errMsg}`;

  const embed = {
    title,
    description: desc,
    color,
    timestamp: new Date().toISOString(),
    fields: [],
  };
  const url = payload?.url ?? data?.url ?? payload?.deployment?.url ?? payload?.urls?.live;
  if (url) embed.fields.push({ name: 'URL', value: url, inline: false });

  return { embeds: [embed] };
}

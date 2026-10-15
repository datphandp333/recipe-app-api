import { AsyncLocalStorage } from 'node:async_hooks';
const context = new AsyncLocalStorage();
export const aiRequestSignal = () => context.getStore()?.signal;
export const withAIUsage = (metadata, callback) => context.run(metadata, callback);
export function recordAIUsage(model, usage, env = process.env) {
  const inputTokens = Number(usage?.promptTokenCount || 0);
  const outputTokens = Number(usage?.candidatesTokenCount || 0) + Number(usage?.thoughtsTokenCount || 0);
  const inputRate = Number(env.AI_INPUT_USD_PER_MILLION);
  const outputRate = Number(env.AI_OUTPUT_USD_PER_MILLION);
  const configured = usage && env.AI_INPUT_USD_PER_MILLION && env.AI_OUTPUT_USD_PER_MILLION
    && Number.isFinite(inputRate) && inputRate >= 0 && Number.isFinite(outputRate) && outputRate >= 0;
  console.info(JSON.stringify({ event: 'ai_usage', feature: context.getStore()?.feature, requestId: context.getStore()?.requestId, model, inputTokens: usage ? inputTokens : null, outputTokens: usage ? outputTokens : null,
    estimatedCostUSD: configured ? (inputTokens * inputRate + outputTokens * outputRate) / 1e6 : null }));
}

import OpenAI from 'openai';

import { env } from '../config/env.js';
import { logger } from './logger.js';

const openAiModel = 'gpt-5.4';

let client: OpenAI | null = null;
let hasWarnedAboutMissingApiKey = false;

const getClient = () => {
  if (!env.openAiApiKey) {
    if (!hasWarnedAboutMissingApiKey) {
      logger.warn('openai.not_configured', {
        message: 'OPENAI_API_KEY is missing. Chat replies will fall back to deterministic prompts.',
      });
      hasWarnedAboutMissingApiKey = true;
    }

    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.openAiApiKey,
    });
  }

  return client;
};

export const generateAssistantReply = async ({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}) => {
  const openAiClient = getClient();

  if (!openAiClient) {
    return null;
  }

  try {
    const response = await openAiClient.chat.completions.create({
      messages: [
        {
          content: systemPrompt,
          role: 'system',
        },
        {
          content: userPrompt,
          role: 'user',
        },
      ],
      model: openAiModel,
    });

    const content = response.choices[0]?.message?.content?.trim();
    return content && content.length > 0 ? content : null;
  } catch (error) {
    logger.warn('openai.reply_failed', {
      error: error instanceof Error ? error.message : 'Unknown OpenAI error',
      model: openAiModel,
    });

    return null;
  }
};
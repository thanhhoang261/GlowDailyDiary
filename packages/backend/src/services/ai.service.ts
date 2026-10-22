import { prisma } from '../prisma.js';
import { AiReviewResult } from '@diary/shared';

const SYSTEM_PROMPT = `You are a warm, encouraging, expert English teacher and language coach for a personal English diary application called "Daily Glow Diary".
Your job is to help the user improve their written English by reviewing their diary entry.

Instructions:
1. Carefully check spelling, grammar, punctuation, verb tenses, prepositions, and natural idioms.
2. PRESERVE THE WRITER'S VOICE, tone, and personal emotions. Do not make the entry sound like a robotic corporate email or overly formal academic essay. Keep it sounding like an intimate, genuine personal journal.
3. Provide clear, friendly, and practical explanations for each change. Format each explanation in Vietnamese so the user (a Vietnamese English learner) can easily understand and remember the rule.
4. If the entry is already very good, celebrate that! You can still suggest subtle natural native collocations.

Return a STRICT JSON object with the following schema:
{
  "correctedTitle": string,
  "correctedContent": string,
  "changes": [
    {
      "original": string,
      "corrected": string,
      "type": "grammar" | "spelling" | "vocabulary" | "naturalness",
      "explanation": string
    }
  ],
  "encouragement": string,
  "overallFeedback": string
}`;

export async function resolveApiKey(userId?: string, directKey?: string): Promise<string> {
  // 1. Direct key passed from client
  if (directKey && directKey.trim().startsWith('sk-')) {
    return directKey.trim();
  }

  // 2. User key saved in database
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { openaiApiKey: true },
    });
    if (user?.openaiApiKey && user.openaiApiKey.trim().startsWith('sk-')) {
      return user.openaiApiKey.trim();
    }
  }

  // 3. Environment variable on server
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey && envKey.trim().startsWith('sk-')) {
    return envKey.trim();
  }

  throw new Error('NO_API_KEY');
}

export async function reviewDiaryWithAi(params: {
  userId?: string;
  title?: string;
  content: string;
  apiKey?: string;
}): Promise<AiReviewResult> {
  const { userId, title = '', content, apiKey: directKey } = params;

  if (!content || !content.trim()) {
    throw new Error('Content is empty. Please write some English words first!');
  }

  const apiKey = await resolveApiKey(userId, directKey);

  const userPrompt = `Title: ${title || '(No title)'}\n\nEntry Content:\n${content.trim()}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMsg = `OpenAI API error (${response.status})`;
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.error?.message) {
        errorMsg = errJson.error.message;
      }
    } catch {
      // keep fallback
    }

    if (response.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your key at platform.openai.com');
    }
    if (response.status === 429) {
      throw new Error('OpenAI rate limit or insufficient quota reached. Please check your OpenAI account billing.');
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('OpenAI returned an empty response. Please try again.');
  }

  try {
    const parsed = JSON.parse(rawContent);
    return {
      correctedTitle: parsed.correctedTitle || title,
      correctedContent: parsed.correctedContent || content,
      changes: Array.isArray(parsed.changes) ? parsed.changes : [],
      encouragement: parsed.encouragement || 'Well done! Keep writing every day! ✨',
      overallFeedback: parsed.overallFeedback || '',
      analyzedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    throw new Error(`Failed to parse AI response: ${err.message}`);
  }
}

export async function saveUserApiKey(userId: string, apiKey: string | null): Promise<void> {
  const cleanKey = apiKey ? apiKey.trim() : null;
  await prisma.user.update({
    where: { id: userId },
    data: {
      openaiApiKey: cleanKey,
    },
  });
}

export async function getUserAiConfig(userId: string): Promise<{
  hasCustomKey: boolean;
  hasEnvKey: boolean;
  isReady: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openaiApiKey: true },
  });

  const hasCustomKey = Boolean(user?.openaiApiKey && user.openaiApiKey.startsWith('sk-'));
  const hasEnvKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'));

  return {
    hasCustomKey,
    hasEnvKey,
    isReady: hasCustomKey || hasEnvKey,
  };
}

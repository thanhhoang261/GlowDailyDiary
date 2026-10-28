import { prisma } from '../prisma.js';
import { AiReviewResult, CoachReport, ReviewDiscussionMessage } from '@diary/shared';
import { decryptForUser, encryptForUser } from './crypto.service.js';

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

const COACH_SYSTEM_PROMPT = `You are a personalized, world-class English Writing Coach for "Daily Glow Diary", an intimate personal journaling app for Vietnamese English learners.
Your mission is to deeply examine the user's historical diary entries and their previous grammar mistakes to provide a heartwarming, deeply insightful, and actionable progress report in Vietnamese & English.

Instructions:
1. Identify Recurring Mistakes & Grammar Traps:
   - What patterns or errors show up repeatedly (e.g. dropping past tense endings, confusing prepositions like in/on/at, missing articles a/an/the, Vietlish literal translations)?
   - For each mistake, give the category in Vietnamese, clear explanation, frequency ("Thường xuyên" | "Thỉnh thoảng"), real examples with the wrong/original text from the user, the natural corrected English, and an explanatory note.
   - Provide a memorable 1-sentence quick tip ("quickTip") so they never make that mistake again.
2. Vocabulary & Expression Upgrades:
   - Find bland, overused, or repetitive words the user leans on too much (e.g., "very happy", "good", "tired", "really", "busy", "sad").
   - Offer 2 vivid, natural, native alternatives (collocations, expressive adjectives, or idioms) with Vietnamese meanings and realistic diary example sentences.
   - Explain why this elevates their personal writing.
3. Grammar Mini-Lesson of the Week:
   - Choose the single most relevant grammar concept they should focus on mastering right now.
   - Provide a title, clear rule explanation, 2-3 key takeaways ("keyPoints"), and a common pitfall ("commonPitfall").
4. Real Strengths & Growth:
   - Give 2-3 genuine, encouraging praises on what the user is doing great (e.g. expressive vocabulary, clear storytelling, dedication).
5. Today's Writing Challenge:
   - Provide an exciting, bite-sized writing challenge for their NEXT diary entry targeting their areas of improvement.
   - Include a suggested sentence prompt they can immediately click to start writing.
6. Daily Pocket Tip:
   - A short, memorable golden rule for today.

Tone: Warm, encouraging, cute, pastel, inspiring, and pedagogically clear. Vietnamese explanations should be natural, modern, and gentle.

Return a STRICT JSON object matching this schema:
{
  "overallLevelSummary": "string",
  "strengths": ["string", "string"],
  "recurringMistakes": [
    {
      "category": "string",
      "description": "string",
      "frequency": "Thường xuyên" | "Thỉnh thoảng",
      "examples": [
        {
          "wrong": "string",
          "better": "string",
          "note": "string"
        }
      ],
      "quickTip": "string"
    }
  ],
  "vocabularyUpgrades": [
    {
      "originalWord": "string",
      "reason": "string",
      "betterAlternatives": [
        {
          "word": "string",
          "meaning": "string",
          "example": "string"
        }
      ]
    }
  ],
  "grammarMiniLesson": {
    "title": "string",
    "rule": "string",
    "keyPoints": ["string", "string"],
    "commonPitfall": "string"
  },
  "dailyTip": "string",
  "todayChallenge": {
    "title": "string",
    "description": "string",
    "suggestedPrompt": "string"
  }
}`;

export function createStarterCoachReport(): CoachReport {
  return {
    analyzedEntriesCount: 0,
    analyzedAt: new Date().toISOString(),
    overallLevelSummary: 'Chào mừng bạn đến với góc Cố vấn Tiếng Anh Cá nhân Hoá! Hãy tiếp tục viết nhật ký mỗi ngày, Coach sẽ tự động đồng hành, tổng hợp các lỗi sai lặp lại và gợi ý từ vựng riêng cho bạn nhé! 🌸',
    strengths: [
      'Tinh thần kiên trì và thói quen phản tư hàng ngày',
      'Sẵn sàng học hỏi và mở rộng vốn từ tiếng Anh',
      'Dám viết ra những suy nghĩ chân thật bằng một ngôn ngữ mới'
    ],
    recurringMistakes: [
      {
        category: 'Thì Quá khứ Đơn (Past Simple Tense)',
        description: 'Khi viết nhật ký kể về những việc đã diễn ra trong ngày, hãy luôn nhớ chuyển động từ sang dạng Quá khứ (V2/V-ed).',
        frequency: 'Thường xuyên',
        examples: [
          {
            wrong: 'Today I go to work and have a meeting with my team.',
            better: 'Today I went to work and had a meeting with my team.',
            note: 'go -> went, have -> had khi kể lại sự kiện đã hoàn tất trong ngày.'
          }
        ],
        quickTip: 'Quy tắc vàng của nhật ký: Kể chuyện hôm nay = Ưu tiên dùng thì Quá khứ đơn!'
      },
      {
        category: 'Giới từ thời gian: IN, ON, AT',
        description: 'Nhầm lẫn khi dùng giới từ chỉ thời gian trong ngày.',
        frequency: 'Thỉnh thoảng',
        examples: [
          {
            wrong: 'I woke up in 7 AM on morning.',
            better: 'I woke up at 7 AM in the morning.',
            note: 'AT + giờ cụ thể (at 7 AM), IN + buổi trong ngày (in the morning), ON + ngày/thứ (on Monday).'
          }
        ],
        quickTip: 'Nhớ câu thần chú: In năm, in tháng, in mùa - In sáng, chiều, tối - Ngày On, giờ At!'
      }
    ],
    vocabularyUpgrades: [
      {
        originalWord: 'very happy',
        reason: 'Từ "happy" rất phổ biến nhưng có thể nâng tầm diễn đạt để bài viết giàu cảm xúc hơn.',
        betterAlternatives: [
          {
            word: 'overjoyed',
            meaning: 'vô cùng vui sướng, ngập tràn hạnh phúc',
            example: 'I was overjoyed to receive warm feedback from my team today.'
          },
          {
            word: 'in high spirits',
            meaning: 'tâm trạng phấn chấn, yêu đời',
            example: 'The sunny morning kept me in high spirits all afternoon.'
          }
        ]
      },
      {
        originalWord: 'tired',
        reason: 'Thay vì chỉ nói "tired", bạn có thể diễn tả mức độ mệt mỏi tự nhiên hơn.',
        betterAlternatives: [
          {
            word: 'exhausted',
            meaning: 'kiệt sức sau một ngày dài làm việc',
            example: 'I felt exhausted after a long sprint, but deeply satisfied.'
          },
          {
            word: 'drained',
            meaning: 'cạn kiệt năng lượng',
            example: 'Dealing with heavy traffic left me mentally drained.'
          }
        ]
      }
    ],
    grammarMiniLesson: {
      title: 'Cách dùng "Used to" vs "Be used to" trong nhật ký',
      rule: 'Phân biệt giữa việc "từng có thói quen trong quá khứ" và "đã quen với việc gì ở hiện tại".',
      keyPoints: [
        'Used to + V-inf: Từng làm gì trong quá khứ (giờ không làm nữa). Ví dụ: "I used to sleep late."',
        'Be/Get used to + V-ing: Đã quen với việc gì. Ví dụ: "I am getting used to writing English every morning."'
      ],
      commonPitfall: 'Đừng nhầm: sau "am used to" phải là V-ing, không phải động từ nguyên mẫu!'
    },
    dailyTip: 'Hãy viết tự nhiên theo dòng cảm xúc trước, đừng quá lo lắng về ngữ pháp khi đang viết nháp. AI Coach sẽ luôn ở đây để đồng hành và hỗ trợ bạn!',
    todayChallenge: {
      title: 'Kể về một điều khiến bạn bất ngờ',
      description: 'Trong bài viết hôm nay, hãy thử dùng cấu trúc "It surprised me that..." hoặc "To my surprise, ..."',
      suggestedPrompt: 'To my surprise, today I discovered that...'
    }
  };
}

export async function generatePersonalizedCoachReport(userId: string, directKey?: string): Promise<CoachReport> {
  const apiKey = await resolveApiKey(userId, directKey);

  // 1. Fetch user's recent entries
  const entries = await prisma.diaryEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 15,
    select: {
      date: true,
      title: true,
      content: true,
      aiReview: true,
      vocabList: true,
    },
  });

  // If user has no entries or only empty ones, return starter report
  const validEntries = entries.filter((e) => Boolean(e.content && e.content.trim()));
  if (validEntries.length === 0) {
    const starter = createStarterCoachReport();
    await prisma.user.update({
      where: { id: userId },
      data: {
        coachReport: JSON.stringify(starter),
        lastCoachAnalysisAt: new Date(),
      },
    });
    return starter;
  }

  // 2. Prepare entries summary for AI analysis
  const summaryParts: string[] = [];
  validEntries.forEach((entry, idx) => {
    const plainContent = decryptForUser(userId, entry.content);
    let reviewInsights = '';
    if (entry.aiReview) {
      try {
        const decReview = decryptForUser(userId, entry.aiReview);
        const parsed = JSON.parse(decReview);
        if (parsed.changes && Array.isArray(parsed.changes) && parsed.changes.length > 0) {
          const changeList = parsed.changes
            .slice(0, 5)
            .map((c: any) => `[${c.type || 'error'}] "${c.original}" -> "${c.corrected}" (${c.explanation || ''})`)
            .join('; ');
          reviewInsights = `\nPrior Errors Corrected: ${changeList}`;
        }
      } catch {}
    }

    summaryParts.push(
      `--- Diary Entry #${idx + 1} (${entry.date}) Title: "${entry.title}" ---
Content:
${plainContent.slice(0, 1200)}${reviewInsights}`
    );
  });

  const userPrompt = `Here are the user's past ${validEntries.length} diary entries and previously corrected errors:\n\n${summaryParts.join('\n\n')}\n\nPlease analyze these entries and generate a personalized learning report with recurring mistakes, vocabulary upgrades, a weekly grammar lesson, and today's writing challenge.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: COACH_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
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
    } catch {}

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
    const report: CoachReport = {
      analyzedEntriesCount: validEntries.length,
      analyzedAt: new Date().toISOString(),
      overallLevelSummary: parsed.overallLevelSummary || 'Bạn đang có sự tiến bộ rất rõ rệt qua từng ngày viết nhật ký!',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Khả năng diễn đạt cảm xúc chân thực', 'Vốn từ vựng phong phú'],
      recurringMistakes: Array.isArray(parsed.recurringMistakes) ? parsed.recurringMistakes : [],
      vocabularyUpgrades: Array.isArray(parsed.vocabularyUpgrades) ? parsed.vocabularyUpgrades : [],
      grammarMiniLesson: parsed.grammarMiniLesson || {
        title: 'Quy tắc chia thì nhất quán',
        rule: 'Giữ thì của các câu nhất quán khi kể một chuỗi hành động.',
        keyPoints: ['Xác định trục thời gian chính', 'Không đổi thì đột ngột giữa các mệnh đề'],
        commonPitfall: 'Đang dùng Quá khứ đơn bỗng nhảy sang Hiện tại đơn.'
      },
      dailyTip: parsed.dailyTip || 'Mỗi ngày học 1 cấu trúc mới và áp dụng ngay vào nhật ký sẽ giúp bạn nhớ lâu gấp 3 lần!',
      todayChallenge: parsed.todayChallenge || {
        title: 'Kể lại một khoảnh khắc thú vị',
        description: 'Hãy thử dùng một cấu trúc câu ghép hoặc trạng từ chỉ thời gian mới trong bài viết hôm nay.',
        suggestedPrompt: 'The moment that made today memorable was...'
      },
    };

    // Save to user profile for quick loading
    await prisma.user.update({
      where: { id: userId },
      data: {
        coachReport: JSON.stringify(report),
        lastCoachAnalysisAt: new Date(),
      },
    });

    return report;
  } catch (err: any) {
    throw new Error(`Failed to parse Coach report: ${err.message}`);
  }
}

export async function getOrGenerateCoachReport(userId: string, directKey?: string, forceRefresh = false): Promise<CoachReport> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coachReport: true, lastCoachAnalysisAt: true },
  });

  if (!forceRefresh && user?.coachReport) {
    try {
      const parsed = JSON.parse(user.coachReport) as CoachReport;
      return parsed;
    } catch {
      // If parsing fails, regenerate
    }
  }

  try {
    return await generatePersonalizedCoachReport(userId, directKey);
  } catch (err: any) {
    if (err.message === 'NO_API_KEY') {
      if (!forceRefresh) {
        // Return starter report gracefully on initial visit without blocking UI
        const starter = createStarterCoachReport();
        await prisma.user.update({
          where: { id: userId },
          data: {
            coachReport: JSON.stringify(starter),
            lastCoachAnalysisAt: new Date(),
          },
        });
        return starter;
      }
    }
    throw err;
  }
}

export async function discussAiReview(params: {
  userId: string;
  date: string;
  question: string;
  targetSnippet?: string;
  changeIndex?: number;
  apiKey?: string;
}): Promise<{ reply: string; updatedReview: AiReviewResult }> {
  const { userId, date, question, targetSnippet, changeIndex, apiKey: directKey } = params;

  if (!question || !question.trim()) {
    throw new Error('Vui lòng nhập câu hỏi hoặc thắc mắc của bạn.');
  }

  // 1. Fetch entry for this user and date
  const entry = await prisma.diaryEntry.findUnique({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
  });

  if (!entry) {
    throw new Error('Không tìm thấy bài viết nhật ký này.');
  }

  const plainTitle = entry.title || '';
  const plainContent = decryptForUser(userId, entry.content);

  let review: AiReviewResult;
  if (entry.aiReview) {
    try {
      const dec = decryptForUser(userId, entry.aiReview);
      review = JSON.parse(dec);
    } catch {
      throw new Error('Bản nhận xét AI của bài viết này bị lỗi định dạng.');
    }
  } else {
    throw new Error('Bài viết này chưa có nhận xét AI để trao đổi. Hãy bấm Soát lỗi AI trước nhé!');
  }

  const apiKey = await resolveApiKey(userId, directKey);

  // 2. Build discussion context
  const existingDiscussion = Array.isArray(review.discussion) ? review.discussion : [];

  // Provide last 6 messages in the conversation for continuity
  const conversationHistory = existingDiscussion.slice(-6).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const changesContext = (review.changes || [])
    .map((c, i) => `#${i + 1}: "${c.original}" -> "${c.corrected}" (Giải thích: ${c.explanation})`)
    .join('\n');

  let targetContext = '';
  if (targetSnippet) {
    targetContext = `\nThe user is specifically asking about this particular change/feedback:\n>>> "${targetSnippet}"\n`;
  }

  const systemPrompt = `You are a warm, gentle, expert English Tutor and language coach for a personal English diary app called "Daily Glow Diary".
The user is a Vietnamese learner who wrote a diary entry and received AI corrections.
Now they have a follow-up question or want to discuss a specific feedback/correction further.

User's Diary Title: "${plainTitle}"
User's Original Entry:
"""
${plainContent.slice(0, 1500)}
"""

AI Revised Entry:
"""
${review.correctedContent?.slice(0, 1500) || ''}
"""

List of AI Corrections Made:
${changesContext}
${targetContext}

Instructions:
1. Answer the user's question with clarity, warmth, and depth.
2. Explain the reasoning clearly in natural, modern Vietnamese, with clear English examples.
3. If the user asks for examples, provide 2-3 realistic, relatable daily journal example sentences with Vietnamese translations.
4. If the user asks whether their original phrase was okay, explain the nuance (is it strictly grammatically wrong, or just unnatural / informal / awkward?).
5. Keep the tone friendly, encouraging, and supportive (like a friendly companion teacher).
6. Format nicely with markdown (bold, bullet points, quotes) for easy reading on mobile/desktop.`;

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: question.trim() },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.5,
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
    } catch {}

    if (response.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your key at platform.openai.com');
    }
    if (response.status === 429) {
      throw new Error('OpenAI rate limit or insufficient quota reached. Please check your OpenAI account billing.');
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('OpenAI returned an empty response. Please try again.');
  }

  // 3. Append messages to discussion
  const now = new Date().toISOString();
  const userMsg: ReviewDiscussionMessage = {
    id: `msg-${Date.now()}-u`,
    role: 'user',
    content: question.trim(),
    targetSnippet,
    changeIndex,
    createdAt: now,
  };
  const assistantMsg: ReviewDiscussionMessage = {
    id: `msg-${Date.now() + 1}-a`,
    role: 'assistant',
    content: reply,
    targetSnippet,
    changeIndex,
    createdAt: new Date().toISOString(),
  };

  const updatedDiscussion = [...existingDiscussion, userMsg, assistantMsg];
  const updatedReview: AiReviewResult = {
    ...review,
    discussion: updatedDiscussion,
  };

  // 4. Save encrypted review back to DB
  const encryptedReview = encryptForUser(userId, JSON.stringify(updatedReview));
  await prisma.diaryEntry.update({
    where: { id: entry.id },
    data: { aiReview: encryptedReview },
  });

  return { reply, updatedReview };
}

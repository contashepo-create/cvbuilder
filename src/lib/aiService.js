import { useAIStore } from '../store/aiStore'

/**
 * Unified AI Service
 * Supports OpenAI-compatible, Anthropic, Cohere, and Gemini API formats
 */

export async function callAI({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2000 }) {
  const store = useAIStore.getState()
  const provider = store.getProvider()
  const apiKey = store.apiKey
  const model = store.getActiveModel()

  if (!apiKey || !model) {
    throw new Error('AI_NOT_CONFIGURED')
  }

  const baseUrl = store.baseUrl || provider.defaultBaseUrl

  switch (provider.format) {
    case 'openai':
      return callOpenAI({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens })
    case 'anthropic':
      return callAnthropic({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens })
    case 'gemini':
      return callGemini({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens })
    case 'cohere':
      return callCohere({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens })
    default:
      return callOpenAI({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens })
  }
}

async function callOpenAI({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens }) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI Error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callAnthropic({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens }) {
  const res = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI Error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

async function callGemini({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens }) {
  const res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI Error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callCohere({ baseUrl, apiKey, model, systemPrompt, userPrompt, temperature, maxTokens }) {
  const res = await fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      message: userPrompt,
      preamble: systemPrompt,
      temperature,
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI Error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.text || ''
}

// ---- High-level AI helpers ----

export async function aiSuggestSummary(jobTitle, lang = 'en') {
  const isAr = lang === 'ar'
  const system = `You are a professional CV writer. Respond in ${isAr ? 'Arabic' : 'English'} ONLY. Generate 5 different professional summary options tailored to the profession "${jobTitle}". Each summary should be 2-3 sentences highlighting key strengths, experience level, and value proposition relevant to ${jobTitle}. Return ONLY the summaries, one per line, prefixed with numbers (1. 2. 3. 4. 5.). No extra commentary.`
  const user = `Write 5 professional CV summary options for a ${jobTitle}. Make them specific to the profession, not generic.`
  const result = await callAI({ systemPrompt: system, userPrompt: user, temperature: 0.8, maxTokens: 1200 })
  return result.split('\n').filter((l) => l.trim())
}

export async function aiImproveSummary(currentSummary, jobTitle, lang = 'en') {
  const isAr = lang === 'ar'
  const system = `You are a professional CV writer. Improve the given summary. Respond in ${isAr ? 'Arabic' : 'English'} only. Return ONLY the improved summary text, no commentary.`
  const user = `Job title: ${jobTitle}\n\nCurrent summary: ${currentSummary}\n\nImprove this summary to be more impactful, using strong action verbs and quantifiable achievements where possible.`
  return callAI({ systemPrompt: system, userPrompt: user, temperature: 0.7, maxTokens: 500 })
}

export async function aiImproveExperienceDescription(description, position, company, lang = 'en') {
  const isAr = lang === 'ar'
  const system = `You are a professional CV writer. Improve job experience descriptions. Respond in ${isAr ? 'Arabic' : 'English'} only. Return ONLY the improved bullet points, one per line starting with a bullet point character. No commentary.`
  const user = `Position: ${position} at ${company}\nCurrent description: ${description}\n\nRewrite this as 3-5 strong bullet points using action verbs and including quantifiable metrics where possible.`
  return callAI({ systemPrompt: system, userPrompt: user, temperature: 0.7, maxTokens: 600 })
}

export async function aiSuggestSkills(jobTitle, lang = 'en') {
  const isAr = lang === 'ar'
  const system = `You are a career advisor. Respond in ${isAr ? 'Arabic' : 'English'} only. Return a comma-separated list of 10-15 relevant skills for the given profession. No extra text.`
  const user = `List relevant skills for a ${jobTitle}.`
  const result = await callAI({ systemPrompt: system, userPrompt: user, temperature: 0.5, maxTokens: 300 })
  return result.split(',').map((s) => s.trim()).filter(Boolean)
}

export async function aiSuggestCertifications(jobTitle, lang = 'en') {
  const isAr = lang === 'ar'
  const system = `You are a career advisor. Respond in ${isAr ? 'Arabic' : 'English'} only. Return a JSON array of objects with "name" and "issuer" fields for 5 relevant certifications. Only JSON, no other text.`
  const user = `Suggest relevant certifications for a ${jobTitle}.`
  const result = await callAI({ systemPrompt: system, userPrompt: user, temperature: 0.5, maxTokens: 500 })
  try {
    return JSON.parse(result)
  } catch {
    return []
  }
}

export async function aiTranslateCV(content, fromLang, toLang) {
  const system = `You are a professional CV translator. Translate all text fields in the CV JSON from ${fromLang === 'ar' ? 'Arabic' : 'English'} to ${toLang === 'ar' ? 'Arabic' : 'English'}. Return ONLY valid JSON with the same structure. Preserve all IDs and structure. Only translate human-readable text fields (names, descriptions, titles, etc.), not structural fields.`
  const user = `Translate this CV content to ${toLang === 'ar' ? 'Arabic' : 'English'}:\n\n${JSON.stringify(content, null, 2)}`
  const result = await callAI({ systemPrompt: system, userPrompt: user, temperature: 0.3, maxTokens: 4000 })
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(result)
  } catch {
    throw new Error('AI translation failed: could not parse response')
  }
}

export async function aiGenerateFullCV(jobTitle, personalInfo, lang = 'en') {
  const isAr = lang === 'ar'
  const system = `You are a professional CV writer. Respond in ${isAr ? 'Arabic' : 'English'} only. Generate a complete CV content as JSON. Return ONLY valid JSON, no markdown, no commentary.`
  const user = `Generate a professional CV for a ${jobTitle}.
The person's name is ${personalInfo?.fullName || 'N/A'}.
Create realistic and professional content for all sections.
Use this exact JSON structure:
{
  "summary": "professional summary text",
  "experience": [{"company":"","position":"","startDate":"2022-01","endDate":"2024-01","current":false,"description":"• bullet point 1\\n• bullet point 2"}],
  "education": [{"institution":"","degree":"","field":"","startDate":"2018-01","endDate":"2022-01","description":""}],
  "skills": [{"name":"","level":"intermediate"}],
  "languages": [{"name":"English","level":"fluent"}],
  "certifications": [{"name":"","issuer":"","date":"2023-01","expiryDate":""}],
  "projects": [{"name":"","description":"","url":"","technologies":[]}]
}
Fill all fields with realistic professional content for a ${jobTitle}.`
  const result = await callAI({ systemPrompt: system, userPrompt: user, temperature: 0.7, maxTokens: 3000 })
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(result)
  } catch {
    throw new Error('AI generation failed: could not parse response')
  }
}

export async function aiTestConnection() {
  const result = await callAI({
    systemPrompt: 'You are a test assistant. Reply with exactly: OK',
    userPrompt: 'Test connection. Reply OK.',
    temperature: 0,
    maxTokens: 10,
  })
  return result.trim().toLowerCase().includes('ok')
}

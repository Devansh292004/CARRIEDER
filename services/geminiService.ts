
import { FileData, JobOpportunity, ChatMessage, GroundingSource, CompanyDossier, DeepResumeAnalysis, KeyPerson, OutreachSequence, LinkedInProfileStrategy, LinkedInPost, CareerRoadmap, MapLocation, FutureSimulation, TribunalSession, ResonanceAnalysis } from '../types';
import { GoogleGenAI, Type, Modality } from "@google/genai";

// --- KEY ROTATION SYSTEM (AKRS) ---
const RAW_KEYS = process.env.API_KEY || '';
const API_KEYS = RAW_KEYS.includes(',') 
  ? RAW_KEYS.split(',').map(k => k.trim()).filter(k => k) 
  : [RAW_KEYS];

let currentKeyIndex = 0;
const exhaustedKeys = new Set<number>();

export const getCurrentApiKey = () => {
    const customKey = localStorage.getItem('carrieder_custom_api_key');
    if (customKey) return customKey;
    return API_KEYS[currentKeyIndex];
};

export const ensureApiKeySelected = async () => {
  if (typeof window !== 'undefined' && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    return true;
  }
  return false;
};

export const getKeyStatus = () => {
    const customKey = localStorage.getItem('carrieder_custom_api_key');
    return {
        total: API_KEYS.length,
        active: API_KEYS.length - exhaustedKeys.size,
        currentIndex: currentKeyIndex,
        isUsingPool: API_KEYS.length > 1 && !customKey,
        isCustom: !!customKey
    };
};

const rotateKey = () => {
    if (API_KEYS.length <= 1) return;
    let attempts = 0;
    do {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        attempts++;
    } while (exhaustedKeys.has(currentKeyIndex) && attempts < API_KEYS.length);

    if (exhaustedKeys.size === API_KEYS.length) {
        console.warn("All keys exhausted. Resetting pool for retry.");
        exhaustedKeys.clear();
    }
};

const getAi = () => {
    const key = getCurrentApiKey();
    if (!key) throw new Error("No API Configuration Found. Please set an API Key in Settings.");
    return new GoogleGenAI({ apiKey: key });
};

const executeWithRetry = async <T>(
    operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> => {
    const customKey = localStorage.getItem('carrieder_custom_api_key');
    if (customKey) {
        try {
            const ai = getAi();
            return await operation(ai);
        } catch (error: any) {
            throw error; 
        }
    }

    const maxRetries = API_KEYS.length + 1;
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const ai = getAi();
            return await operation(ai);
        } catch (error: any) {
            const isRateLimit = error.status === 429 || 
                              error.status === 503 || 
                              error.response?.status === 429 ||
                              error.error?.code === 429 ||
                              error.error?.status === 'RESOURCE_EXHAUSTED' ||
                              error.message?.includes('429') || 
                              error.message?.includes('403') ||
                              error.message?.includes('RESOURCE_EXHAUSTED') ||
                              error.message?.includes('quota');
            
            if (isRateLimit && API_KEYS.length > 1) {
                console.warn(`Key #${currentKeyIndex + 1} depleted. Engaging auto-rotation...`);
                exhaustedKeys.add(currentKeyIndex);
                rotateKey();
                attempts++;
                await new Promise(r => setTimeout(r, 500));
            } else {
                throw error;
            }
        }
    }
    throw new Error("System Failure: All API Power Cells Depleted.");
};

// Helper: Robust JSON Cleaner
const cleanJson = (text: string) => {
    if (!text) return "{}";
    
    // 1. Try to extract from Markdown code blocks first
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        text = codeBlockMatch[1];
    }

    // 2. Find the first '{' and the last '}' to strip conversational preludes/postscripts
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1);
    }

    return text; // Return original if no braces found (likely to fail parse, but prevents substring errors)
};

const extractSources = (response: any): GroundingSource[] => {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks
        .filter((c: any) => c.web?.uri && c.web?.title)
        .map((c: any) => ({
            title: c.web.title,
            uri: c.web.uri
        }));
};

const extractMapLocations = (response: any): MapLocation[] => {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks
        .filter((c: any) => c.maps?.uri)
        .map((c: any) => ({
            title: c.maps.placeAnswerSources?.reviewSnippets?.[0]?.reviewText?.substring(0, 50) + "..." || c.maps.title || "Location",
            uri: c.maps.uri
        }));
};

// --- AUDIO HELPERS ---
export const decodeAudioData = (base64Data: string, ctx: AudioContext) => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

// --- CORE INTELLIGENCE ---

export const getQuickTip = async (question: string) => {
  return executeWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite', 
          contents: `Provide a single, unconventional, high-impact career tip for: "${question}". Max 2 sentences.`
      });
      return response.text;
  });
};

export const sendChatToAI = async (history: ChatMessage[], systemInstruction: string) => {
  return executeWithRetry(async (ai) => {
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const lastMsg = formattedHistory.pop(); 
      if (!lastMsg) return { text: '' };

      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview', // UPGRADED FOR SMARTER CHAT
        config: { systemInstruction },
        history: formattedHistory
      });

      const response = await chat.sendMessage({
          message: lastMsg.parts[0].text
      });

      return { text: response.text };
  });
};

// --- DEEP THINKING STRATEGY ---
export const generateDeepCareerStrategy = async (query: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: query,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            }
        });
        return response.text;
    });
};

// --- CHRONO LAPSE SIMULATION ---
export const simulateFutureTimeline = async (company: string, role: string, currentRole: string): Promise<FutureSimulation> => {
    return executeWithRetry(async (ai) => {
        const prompt = `
            Act as a Quantum Futurist and Economist. 
            Simulate a realistic 5-year career timeline for a candidate moving from "${currentRole}" to "${role}" at "${company}".
            
            Use deep reasoning to project:
            1. Market trends affecting this specific company/industry over 5 years.
            2. Probable internal politics or structural changes.
            3. A specific 'Artifact' for each year that proves the simulation (e.g., an Email from a boss, a News Headline, a Slack message).
            
            The tone should be visceral, specific, and grounded in economic reality (not just "you get promoted").
            
            Return JSON matching this schema:
            {
                "company": "${company}",
                "role": "${role}",
                "probabilityScore": 85,
                "finalOutcome": "A summary of where the user ends up in 5 years.",
                "timeline": [
                    {
                        "year": 1,
                        "title": "Short event title",
                        "description": "Detailed description of the year's defining moment.",
                        "sentiment": "growth" | "stagnation" | "pivot" | "danger",
                        "marketContext": "Global context (e.g. AI collapse, new tech)",
                        "artifact": {
                            "type": "email" | "news" | "slack" | "award",
                            "title": "Subject line or Headline",
                            "sender": "Sender Name (if email/slack)",
                            "content": "Body text of the artifact",
                            "date": "Future Date"
                        }
                    }
                    // ... 5 years total
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 16000 } // High budget for temporal simulation
            }
        });

        return JSON.parse(response.text);
    });
};

// --- THE TRIBUNAL (Hiring Committee) ---
export const simulateTribunal = async (resumeText: string, company: string, role: string): Promise<TribunalSession> => {
    return executeWithRetry(async (ai) => {
        const prompt = `
            Simulate a brutally honest, internal "Hiring Committee" private Slack/Teams channel at "${company}" discussing a candidate for "${role}".
            
            Characters:
            1. "The Hiring Manager" (Focus: Delivery, Team Fit, Urgency).
            2. "The Skeptic Peer" (Focus: Technical debt, red flags, "can they actually code/lead?").
            3. "The Gatekeeper HR" (Focus: Culture, flight risk, salary expectations).

            CANDIDATE RESUME: "${resumeText.substring(0, 3000)}"

            Task:
            Create a transcript of them arguing about this candidate. They should spot gaps in the resume, question the experience, but also find the strengths.
            
            Return JSON:
            {
                "company": "${company}",
                "role": "${role}",
                "members": [
                    { "id": "m1", "role": "Hiring Manager", "name": "Sarah L.", "avatarInitials": "SL", "hiddenAgenda": "Desperate to hire but burned by last candidate." },
                    { "id": "m2", "role": "Skeptic Peer", "name": "David K.", "avatarInitials": "DK", "hiddenAgenda": "Thinks nobody is good enough. Worried about legacy code." },
                    { "id": "m3", "role": "Gatekeeper HR", "name": "Marcus R.", "avatarInitials": "MR", "hiddenAgenda": "Budget is tight. Wants safe bet." }
                ],
                "transcript": [
                    { "memberId": "m3", "text": "Just dropped the resume in channel. Thoughts?", "sentiment": "neutral", "timestamp": "10:02 AM" },
                    { "memberId": "m2", "text": "Looking now. The tenure at the last job is concerning...", "sentiment": "negative", "timestamp": "10:03 AM", "referencesResume": true }
                    // ... generates 6-8 interactions
                ],
                "finalVerdict": "HIRE" | "NO_HIRE" | "MAYBE",
                "verdictReason": "One sentence summary of the committee decision."
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 16000 }
            }
        });

        return JSON.parse(response.text);
    });
};

// --- RESONANCE ENGINE ---
export const generateCareerResonance = async (urls: string[], currentRole: string): Promise<ResonanceAnalysis> => {
    return executeWithRetry(async (ai) => {
        const prompt = `
            Act as a Hyper-Dimensional Career Physicist. 
            
            Step 1: Use Google Search to gather real-time context about these URLs if they are public profiles (LinkedIn, GitHub, Portfolio): ${urls.join(', ')}. 
            Also consider the user's current role: "${currentRole}".
            
            Step 2: Analyze the implicit "Digital Footprint". Deduce "Shadow Skills" (skills they likely have but don't list), interests, and "vibe".
            
            Step 3: Identify "Dark Matter Opportunities" - roles that the user is highly qualified for but would never think to search for because they are adjacent, emerging, or obscure.
            
            Step 4: Generate a 3D resonance map. 
            - Coordinates x,y,z should be between -100 and 100.
            - "Resonance Score" is the strength of the match (proximity).
            - "Entropy" represents market volatility.
            
            Return ONLY a valid JSON object (no markdown formatting) matching this schema:
            {
                "coreIdentity": "A synthesized 3-word archetype of the user (e.g. 'Systems Architect Poet')",
                "marketEntropy": 0.8,
                "opportunities": [
                    {
                        "id": "1",
                        "role": "Title",
                        "industry": "Industry",
                        "resonanceScore": 95,
                        "hiddenPotential": "Why this weird role fits perfectly.",
                        "coordinates": { "x": 10, "y": 40, "z": -20 },
                        "trajectory": "accelerating", // "stable", "accelerating", "collapsing"
                        "skills": [
                            { "name": "Skill 1", "category": "harmonic", "gapLevel": 10 } // harmonic (have), dissonant (missing), emergent (future)
                        ]
                    }
                    // Generate 6-8 distinct, non-obvious roles
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                // responseMimeType: 'application/json', // Do not use with googleSearch
                thinkingConfig: { thinkingBudget: 16000 },
                tools: [{ googleSearch: {} }] // Enable Google Search Grounding
            }
        });

        const text = response.text || "{}";
        try {
            return JSON.parse(cleanJson(text));
        } catch (e) {
            console.error("JSON Parse Error in Resonance:", text);
            throw new Error("Failed to decode resonance data from the multiverse.");
        }
    });
};

// --- VISUAL FORGE (IMAGES & VIDEO) ---

export const generateProAsset = async (prompt: string, aspectRatio: string = '1:1', size: string = '1K') => {
    return executeWithRetry(async (ai) => {
        if(window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
             await window.aistudio.openSelectKey();
        }
        
        const aiClient = new GoogleGenAI({ apiKey: getCurrentApiKey() }); // Fresh instance for key flow

        const response = await aiClient.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any,
                    imageSize: size as any
                }
            }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image returned");
    });
};

export const editImageWithNano = async (imageBase64: string, mimeType: string, prompt: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: imageBase64, mimeType: mimeType } },
                    { text: prompt }
                ]
            }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Editing failed.");
    });
};

export const generateVeoVideo = async (prompt: string, imageBase64?: string, mimeType?: string, aspectRatio: string = '16:9') => {
    return executeWithRetry(async (ai) => {
        if(window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
             await window.aistudio.openSelectKey();
        }

        const aiClient = new GoogleGenAI({ apiKey: getCurrentApiKey() }); // Ensure fresh client with user key

        let input: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio as any,
                resolution: '720p'
            }
        };

        if (imageBase64 && mimeType) {
            input.image = {
                imageBytes: imageBase64,
                mimeType: mimeType
            };
        }

        let operation = await aiClient.models.generateVideos(input);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 8000));
            operation = await aiClient.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed.");
        
        return `${downloadLink}&key=${getCurrentApiKey()}`;
    });
};

// --- GEOSPATIAL INTEL ---

export const getLocationIntel = async (query: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find the headquarters or main office for: "${query}". Provide the address and a brief summary of the location's reviews or significance.`,
            config: {
                tools: [{ googleMaps: {} }],
            },
        });
        
        return {
            text: response.text,
            locations: extractMapLocations(response)
        };
    });
};

// --- AUDIO & SPEECH ---

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { data: audioBase64, mimeType: mimeType } },
                    { text: "Transcribe this audio exactly. Do not add commentary." }
                ]
            }
        });
        return response.text;
    });
};

export const generateSpeech = async (text: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) return audioData;
        throw new Error("No audio returned");
    });
};

// --- LEGACY/COMPATIBILITY EXPORTS ---

export const generateDeepResumeAnalysis = async (resumeData: FileData | string, jobDesc: string): Promise<DeepResumeAnalysis> => {
    return executeWithRetry(async (ai) => {
        const model = 'gemini-3-flash-preview'; 
        const promptText = `
          You are an elite Career Strategist. Analyze this resume against the target job.
          TARGET JOB: ${jobDesc}
          Return JSON: { "score": number, "summaryCritique": string, "missingKeywords": string[], "sections": [], "tailoredSummary": string }
        `;
  
        let contents: any = {};
        if (typeof resumeData === 'string') {
          contents = { parts: [{ text: `RESUME TEXT:\n${resumeData}\n\n${promptText}` }] };
        } else if (resumeData.inlineData) {
          contents = { parts: [{ inlineData: resumeData.inlineData }, { text: promptText }] };
        } else {
          contents = { parts: [{ text: `RESUME TEXT:\n${resumeData.text}\n\n${promptText}` }] };
        }
  
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { responseMimeType: 'application/json' }
        });
  
        try {
            return JSON.parse(cleanJson(response.text));
        } catch (e) {
            console.error("JSON Parsing failed", e);
            throw new Error("Analysis failed to structure data.");
        }
    });
};

export const enhanceImagePrompt = async (rawPrompt: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Rewrite this image prompt for high-fidelity generation: "${rawPrompt}"`
        });
        return response.text;
    });
};

export const generateBrandAsset = async (prompt: string, aspectRatio: string = '1:1') => {
   return generateProAsset(prompt, aspectRatio, '1K'); 
};

export const generateTailoredResume = async (resumeData: any, jobDesc: string, analysis: any) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: `Rewrite resume based on ${JSON.stringify(analysis)} for ${jobDesc}` }] }
        });
        return response.text;
    });
};

export const findKeyPeople = async (company: string, role: string) => {
  return executeWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find 5 key hiring managers at "${company}" for "${role}". Return JSON: [{ "name": "", "title": "", "relevance": "" }]`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text);
  });
};

export const generateOutreachSequence = async (tName: string, tComp: string, tRole: string, uCtx: any, tone: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Create outreach sequence for ${tName} at ${tComp}. Tone: ${tone}. Return JSON.`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    });
};

export const generateLinkedInStrategy = async (cRole: string, tRole: string, exp: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `LinkedIn strategy for ${cRole} to ${tRole}. Exp: ${exp}. Return JSON.`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    });
};

export const generateLinkedInPost = async (topic: string, tone: string, format: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `LinkedIn post about ${topic}. Tone: ${tone}. Format: ${format}. Return JSON.`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    });
};

export const generateCareerRoadmap = async (data: any, role: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Career roadmap to ${role}. Return JSON.`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    });
};

export const generateCompanyDossier = async (company: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Deep intel on ${company}. JSON.`,
            config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' }
        });
        const parsed = JSON.parse(response.text);
        parsed.sources = extractSources(response);
        return parsed;
    });
};

export const createInterviewContext = (ctx: string, file: any) => `Roleplay interview for: ${ctx}`;

export const getMarketInsights = async (sector: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Market trends for ${sector}.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text;
    });
};

export const findLatestOpportunities = async (role: string, loc: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `5 new jobs for ${role} in ${loc}. JSON.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        try { return JSON.parse(cleanJson(response.text)); } 
        catch { return []; }
    });
};

export const editHeadshot = async (b64: string, mime: string, prompt: string) => {
    return editImageWithNano(b64, mime, prompt);
};

export const verifyCredential = async (name: string, issuer: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Verify credential ${name} from ${issuer}.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text;
    });
};

export const generateVideoPitch = async (prompt: string) => {
    return generateVeoVideo(prompt);
};

export const testConnection = async () => {
    try {
        await executeWithRetry(async (ai) => {
            await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'ping' });
        });
        return { success: true, message: "Gemini Uplink Active" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

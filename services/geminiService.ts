
import { FileData, JobOpportunity, ChatMessage, GroundingSource, CompanyDossier, DeepResumeAnalysis, KeyPerson, OutreachSequence, LinkedInProfileStrategy, LinkedInPost, CareerRoadmap, MapLocation, FutureSimulation, TribunalSession, ResonanceAnalysis, NegotiationAnalysis, WarRoomAnalysis, WorkChallenge, WorkSubmission, ProjectArtifact, BehaviorMetrics } from '../types';
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
  // 1. Check for manually entered key (Local Host Priority)
  if (localStorage.getItem('carrieder_custom_api_key')) return true;
  
  // 2. Check environment key
  if (process.env.API_KEY) return true;

  // 3. Fallback to AI Studio Wrapper (Only if no local key exists)
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

// Robust Error Checker for Google GenAI
const isRateLimitError = (error: any): boolean => {
    return error.status === 429 || 
           error.status === 503 || 
           error.response?.status === 429 ||
           error.error?.code === 429 ||
           error.error?.status === 'RESOURCE_EXHAUSTED' ||
           (typeof error.message === 'string' && (
               error.message.includes('429') || 
               error.message.includes('403') ||
               error.message.includes('RESOURCE_EXHAUSTED') ||
               error.message.includes('quota')
           ));
};

const executeWithRetry = async <T>(
    operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> => {
    const customKey = localStorage.getItem('carrieder_custom_api_key');
    
    // If using custom key, we don't rotate, but we do basic retry backoff
    if (customKey) {
        try {
            const ai = getAi();
            return await operation(ai);
        } catch (error: any) {
            if (isRateLimitError(error)) {
                // One simple retry for custom keys after delay
                await new Promise(r => setTimeout(r, 2000));
                return await operation(getAi());
            }
            throw error; 
        }
    }

    const maxRetries = API_KEYS.length > 1 ? API_KEYS.length + 1 : 2;
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const ai = getAi();
            return await operation(ai);
        } catch (error: any) {
            if (isRateLimitError(error)) {
                console.warn(`Key #${currentKeyIndex + 1} depleted/rate-limited. Engaging mitigation...`);
                
                if (API_KEYS.length > 1) {
                    exhaustedKeys.add(currentKeyIndex);
                    rotateKey();
                } else {
                    // Single key setup: Wait exponentially
                    const delay = 2000 * Math.pow(1.5, attempts);
                    console.warn(`Single key setup. Waiting ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                }
                
                attempts++;
            } else {
                throw error;
            }
        }
    }
    throw new Error("System Failure: All API Quotas Exhausted. Please check billing or try again later.");
};

// Helper: Robust JSON Cleaner
const cleanJson = (text: string) => {
    if (!text) return "{}";
    
    // 1. Prioritize explicit JSON blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        return jsonBlockMatch[1];
    }

    // 2. If no "json" tag, looks for the first code block that STARTS with a valid JSON char
    const genericBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/i);
    if (genericBlockMatch && genericBlockMatch[1]) {
        const content = genericBlockMatch[1].trim();
        if (content.startsWith('{') || content.startsWith('[')) {
            return content;
        }
    }

    // 3. Fallback: Find the first '{' and the last '}' 
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1);
    }

    return text; 
};

// --- THE ARCHITECT (MAGNUM OPUS GENERATOR) ---

export const generateMagnumOpus = async (resumeData: FileData | string, jobDescription: string): Promise<ProjectArtifact> => {
    const instruction = `
        Act as a Senior Principal Software Architect.
        
        GOAL: Create a "Bridge Project" (Magnum Opus) for a candidate.
        The project must:
        1. Use the tech stack required in the TARGET JOB but missing or weak in the RESUME.
        2. Be impressive enough to put on a resume immediately.
        3. Look like it was built by a passionate human.
        
        TARGET JOB DESCRIPTION: ${jobDescription.substring(0, 2000)}
        
        RETURN JSON ONLY matching this schema.
        {
            "id": "project-1",
            "title": "Name of the Project",
            "tagline": "A punchy one-liner description",
            "description": "Short executive summary of what this is.",
            "techStack": ["React", "Go", "Kafka", "etc"],
            "features": ["Feature 1", "Feature 2"],
            "readmeContent": "# Title\\n\\n## Why I built this... (Make it sound personal and strategic)",
            "fileTree": [
                { "name": "src", "type": "folder", "children": [{ "name": "App.tsx", "type": "file" }] }
            ],
            "codeFiles": [
                { "name": "src/App.tsx", "language": "typescript", "content": "..." },
                { "name": "backend/main.go", "language": "go", "content": "..." }
            ],
            "architectureDiagram": "graph TD\\n  subgraph User Layer\\n    Client[Client App]\\n  end\\n  subgraph Cloud Infrastructure\\n    API[API Gateway]\\n    DB[(Database)]\\n  end\\n  Client --> API\\n  API --> DB" 
        }
        
        IMPORTANT FOR DIAGRAM:
        - Use standard Mermaid syntax.
        - Use subgraphs to group components (e.g., 'subgraph Cloud', 'subgraph Data Layer').
        - Use specific shapes: [(Database)] for DBs, [Service] for rectangular services, {{Queue}} for queues.
        - Keep node names short and descriptive.
    `;

    let contents: any[] = [];
    if (typeof resumeData === 'string') {
        contents.push({ text: `CANDIDATE RESUME TEXT:\n${resumeData}` });
    } else if (resumeData.inlineData) {
        contents.push({ inlineData: resumeData.inlineData });
        contents.push({ text: "Use the resume in the file above as the candidate profile." });
    } else if (resumeData.text) {
        contents.push({ text: `CANDIDATE RESUME TEXT:\n${resumeData.text}` });
    } else {
        throw new Error("Invalid resume data provided to Architect.");
    }
    contents.push({ text: instruction });

    // Primary Attempt: Pro Model
    try {
        return await executeWithRetry(async (ai) => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: contents },
                config: {
                    responseMimeType: 'application/json',
                    thinkingConfig: { thinkingBudget: 8000 } // Reduced budget to save tokens
                }
            });
            return JSON.parse(cleanJson(response.text));
        });
    } catch (e: any) {
        // Fallback: Flash Model (If Pro quota exceeded)
        if (isRateLimitError(e)) {
            console.warn("Magnum Opus: Pro model exhausted. Falling back to Flash.");
            return await executeWithRetry(async (ai) => {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: contents },
                    config: {
                        responseMimeType: 'application/json'
                        // No thinking config for Flash to maximize success rate
                    }
                });
                return JSON.parse(cleanJson(response.text));
            });
        }
        throw e;
    }
};

// ... existing code ...

// --- PROOF OF WORK (PROJECT PROTOCOL) ---

export const generateWorkChallenge = async (company: string, role: string): Promise<WorkChallenge> => {
    const runGeneration = async (model: string, useThinking: boolean) => {
        return executeWithRetry(async (ai) => {
            const prompt = `
                Act as a Senior Hiring Manager at ${company} looking for a top-tier ${role}.
                Goal: Create a "Take-Home Challenge" that simulates a real task.
                Return JSON: { "id": "...", "role": "...", "company": "...", "title": "...", "context": "...", "taskDescription": "...", "deliverableFormat": "...", "timeLimit": "...", "difficulty": "Hard" }
            `;
            const config: any = { responseMimeType: 'application/json' };
            if (useThinking) config.thinkingConfig = { thinkingBudget: 8000 };
            
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config
            });
            return JSON.parse(cleanJson(response.text));
        });
    };

    try {
        return await runGeneration('gemini-3-pro-preview', true);
    } catch (e) {
        if (isRateLimitError(e)) return await runGeneration('gemini-2.5-flash', false);
        throw e;
    }
};

export const gradeWorkChallenge = async (challenge: WorkChallenge, solution: string): Promise<WorkSubmission> => {
    return executeWithRetry(async (ai) => {
        const prompt = `
            Act as Hiring Manager at ${challenge.company}.
            Task: Grade this solution for: "${challenge.taskDescription}"
            Candidate Solution: "${solution}"
            Return JSON: { "challengeId": "${challenge.id}", "userSolution": "...", "grade": 85, "feedback": "...", "strengths": [], "weaknesses": [], "emailHook": "..." }
        `;

        // Try Flash first for grading to save Pro quota for creation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        return JSON.parse(cleanJson(response.text));
    });
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
        model: 'gemini-2.5-flash', 
        config: { systemInstruction },
        history: formattedHistory
      });

      const response = await chat.sendMessage({
          message: lastMsg.parts[0].text
      });

      return { text: response.text };
  });
};

export const generateDeepCareerStrategy = async (query: string) => {
    try {
        return await executeWithRetry(async (ai) => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: query,
                config: { thinkingConfig: { thinkingBudget: 8000 } }
            });
            return response.text;
        });
    } catch (e) {
        if (isRateLimitError(e)) {
            return await executeWithRetry(async (ai) => {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: query
                });
                return response.text;
            });
        }
        throw e;
    }
};

export const solveCaseStudy = async (problem: string, role: string): Promise<WarRoomAnalysis> => {
    const run = async (model: string) => {
        return executeWithRetry(async (ai) => {
            const prompt = `
                Act as a Senior Software Architect.
                PROBLEM: "${problem}"
                ROLE: ${role}
                Generate valid Mermaid.js diagram code.
                RETURN JSON: { "summary": "...", "keyConsiderations": [], "diagramType": "...", "diagramCode": "graph TD\\n..." }
            `;
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            return JSON.parse(cleanJson(response.text));
        });
    };

    try {
        return await run('gemini-3-pro-preview');
    } catch (e) {
        if (isRateLimitError(e)) return await run('gemini-2.5-flash');
        throw e;
    }
};

export const analyzeNegotiationOffer = async (
    company: string, 
    role: string, 
    offer: any, 
    goal: any, 
    leverage: string
): Promise<NegotiationAnalysis> => {
    return executeWithRetry(async (ai) => {
        const prompt = `
            Act as Expert Negotiator.
            Scenario: ${company}, ${role}. Offer: ${JSON.stringify(offer)}. Goal: ${JSON.stringify(goal)}. Leverage: ${leverage}.
            Return JSON: { "marketRateAnalysis": "...", "leverageAssessment": "...", "strategy": "...", "recommendedCounter": { "base": "...", "equity": "...", "signOn": "..." }, "script": "..." }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: { responseMimeType: 'application/json', tools: [{ googleSearch: {} }] }
        });

        return JSON.parse(cleanJson(response.text));
    });
};

export const simulateFutureTimeline = async (company: string, role: string, currentRole: string): Promise<FutureSimulation> => {
    const runSim = async (model: string, budget?: number) => {
        return executeWithRetry(async (ai) => {
            const prompt = `
                Simulate 5-year career timeline: "${currentRole}" -> "${role}" at "${company}".
                Return JSON: { "company": "${company}", "role": "${role}", "probabilityScore": 85, "finalOutcome": "...", "timeline": [{ "year": 1, "title": "...", "description": "...", "sentiment": "growth", "marketContext": "...", "artifact": { "type": "email", "title": "...", "sender": "...", "content": "...", "date": "..." } }] }
            `;
            const config: any = { responseMimeType: 'application/json' };
            if (budget) config.thinkingConfig = { thinkingBudget: budget };

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config
            });
            return JSON.parse(cleanJson(response.text));
        });
    };

    try {
        return await runSim('gemini-3-pro-preview', 8000);
    } catch (e) {
        if (isRateLimitError(e)) return await runSim('gemini-2.5-flash');
        throw e;
    }
};

export const simulateTribunal = async (resumeText: string, company: string, role: string): Promise<TribunalSession> => {
    return executeWithRetry(async (ai) => {
        const prompt = `
            Simulate Hiring Committee at "${company}" for "${role}".
            CANDIDATE: "${resumeText.substring(0, 3000)}"
            Return JSON: { "company": "${company}", "role": "${role}", "members": [ ... ], "transcript": [ ... ], "finalVerdict": "HIRE/NO_HIRE/MAYBE", "verdictReason": "..." }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        return JSON.parse(cleanJson(response.text));
    });
};

export const generateCareerResonance = async (urls: string[], currentRole: string): Promise<ResonanceAnalysis> => {
    return executeWithRetry(async (ai) => {
        const prompt = `
            Act as Career Physicist. Analyze URLs: ${urls.join(', ')} and Role: ${currentRole}.
            Identify 6 "Dark Matter Opportunities" (non-obvious roles).
            Return JSON: { "coreIdentity": "...", "marketEntropy": 0.8, "opportunities": [{ "id": "1", "role": "...", "industry": "...", "resonanceScore": 95, "hiddenPotential": "...", "coordinates": { "x": 10, "y": 40, "z": -20 }, "trajectory": "accelerating", "skills": [...] }] }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }] 
            }
        });

        const text = cleanJson(response.text);
        return JSON.parse(text);
    });
};

export const generateProAsset = async (prompt: string, aspectRatio: string = '1:1', size: string = '1K') => {
    return executeWithRetry(async (ai) => {
        // Fallback check to ensure key is ready, though executeWithRetry handles it.
        if (!getCurrentApiKey() && window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
             await window.aistudio.openSelectKey();
        }
        
        const aiClient = new GoogleGenAI({ apiKey: getCurrentApiKey() });

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
        if(!getCurrentApiKey() && window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
             await window.aistudio.openSelectKey();
        }

        const aiClient = new GoogleGenAI({ apiKey: getCurrentApiKey() }); 

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

export const getLocationIntel = async (query: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find headquarters for: "${query}". Address + brief review summary.`,
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

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: audioBase64, mimeType: mimeType } },
                    { text: "Transcribe exact words." }
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

export const analyzeBehavioralCues = async (imageBase64: string): Promise<BehaviorMetrics> => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                    { text: "Analyze face/body for job interview. JSON: { confidence: 0-100, eyeContact: 'Good'|'Fair'|'Poor', posture: 'Open'|'Closed'|'Neutral', feedback: '1 sentence' }" }
                ]
            },
            config: {
                responseMimeType: 'application/json'
            }
        });
        return JSON.parse(cleanJson(response.text));
    });
};

export const generateDeepResumeAnalysis = async (resumeData: FileData | string, jobDesc: string): Promise<DeepResumeAnalysis> => {
    const runAnalysis = async (model: string) => {
        return executeWithRetry(async (ai) => {
            const promptText = `
              Analyze resume vs target job.
              TARGET JOB: ${jobDesc}
              Return JSON: { "score": number, "summaryCritique": string, "missingKeywords": [], "sections": [{ "name": "...", "score": 0, "feedback": "...", "suggestion": "..." }], "tailoredSummary": "..." }
            `;
      
            let contents: any = {};
            if (typeof resumeData === 'string') {
              contents = { parts: [{ text: `RESUME:\n${resumeData}\n\n${promptText}` }] };
            } else if (resumeData.inlineData) {
              contents = { parts: [{ inlineData: resumeData.inlineData }, { text: promptText }] };
            } else {
              contents = { parts: [{ text: `RESUME:\n${resumeData.text}\n\n${promptText}` }] };
            }
      
            const response = await ai.models.generateContent({
              model,
              contents,
              config: { responseMimeType: 'application/json' }
            });
      
            return JSON.parse(cleanJson(response.text));
        });
    };

    try {
        return await runAnalysis('gemini-3-flash-preview');
    } catch (e) {
        if (isRateLimitError(e)) return await runAnalysis('gemini-2.5-flash');
        throw e;
    }
};

export const enhanceImagePrompt = async (rawPrompt: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Optimize prompt for high-fidelity AI image generation: "${rawPrompt}"`
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
            model: 'gemini-2.5-flash', 
            contents: `Create outreach sequence for ${tName} at ${tComp}. Tone: ${tone}. Return JSON.`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text);
    });
};

export const generateLinkedInStrategy = async (cRole: string, tRole: string, exp: string) => {
    return executeWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
            model: 'gemini-2.5-flash',
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

export const findLatestOpportunities = async (role: string, loc: string, visaStatus: string = 'Citizen/PR') => {
    return executeWithRetry(async (ai) => {
        // Construct Visa-Specific Constraints
        let visaContext = '';
        if (visaStatus.includes('Student 500')) {
            visaContext = 'MUST allow "student visa", "casual", "part-time", "contract", or "internship". Look for "immediate start" or "urgent". Max 20-24 hours/week friendly is a plus.';
        } else if (visaStatus.includes('Graduate 485')) {
            visaContext = 'Must accept "Graduate Visa 485". Full-time entry-level roles allowed.';
        } else if (visaStatus.includes('Sponsorship')) {
            visaContext = 'Must explicitly mention "Visa Sponsorship" or "TSS 482" available.';
        }

        const prompt = `
            FIND REAL JOB OPENINGS.
            ROLE: ${role}
            LOCATION: ${loc}
            VISA STATUS: ${visaStatus}
            ${visaContext}

            SEARCH INSTRUCTIONS:
            1. Search for at least 30 open roles to ensure we get ~25 valid results.
            2. Prioritize "Company Career Pages" (Direct ATS links like Greenhouse, Lever, Ashby) over aggregators (Indeed/Seek/LinkedIn) to ensure validity.
            3. Look for "Hidden Gems": < 10 applicants, posted < 24h ago, startups, direct email applications.
            4. If the exact link is behind a login wall, provide the main Career Page URL for that company instead.
            5. DO NOT hallucinate job IDs or links. If you find a job, use the real URL found in search grounding.

            RETURN JSON ARRAY (Min 25 items):
            [
              {
                "id": "unique_string",
                "title": "Role Title",
                "company": "Company Name",
                "url": "Valid URL (prioritize direct company site)",
                "timestamp": "e.g. '2 hours ago', 'Today'",
                "isNew": true/false
              }
            ]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }]
            }
        });
        try { 
            const res = JSON.parse(cleanJson(response.text));
            // Ensure array and IDs to prevent rendering errors
            if (!Array.isArray(res)) return [];
            return res.map((job: any) => ({
                ...job,
                id: job.id || `job-${Math.random().toString(36).substr(2, 9)}`,
                title: job.title || 'Untitled Opportunity',
                company: job.company || 'Unknown Company',
                url: job.url || '#',
                timestamp: job.timestamp || 'Just now'
            }));
        } 
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
            await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'ping' });
        });
        return { success: true, message: "Gemini Uplink Active" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

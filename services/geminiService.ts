import { FileData, JobOpportunity, ChatMessage, GroundingSource, CompanyDossier, DeepResumeAnalysis, KeyPerson, OutreachSequence, LinkedInProfileStrategy, LinkedInPost, CareerRoadmap, MapLocation, FutureSimulation, TribunalSession, ResonanceAnalysis, NegotiationAnalysis, WarRoomAnalysis, WorkChallenge, WorkSubmission, ProjectArtifact, BehaviorMetrics } from '../types';
import { GoogleGenAI, Type, Modality } from "@google/genai";

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
  if (localStorage.getItem('carrieder_custom_api_key')) return true;
  if (process.env.API_KEY) return true;
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
    if (customKey) {
        try {
            const ai = getAi();
            return await operation(ai);
        } catch (error: any) {
            if (isRateLimitError(error)) {
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

const cleanJson = (text: string) => {
    if (!text) return "{}";
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch && jsonBlockMatch[1]) return jsonBlockMatch[1];
    const genericBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/i);
    if (genericBlockMatch && genericBlockMatch[1]) {
        const content = genericBlockMatch[1].trim();
        if (content.startsWith('{') || content.startsWith('[')) return content;
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) return text.substring(firstBrace, lastBrace + 1);
    return text; 
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

export const generateCareerResonance = async (resumeText: string, preferences: string): Promise<ResonanceAnalysis> => {
    const runAnalysis = async (model: string) => {
        return executeWithRetry(async (ai) => {
            const prompt = `
            Act as a Senior Career Counselor and Market Analyst.
            
            ANALYZE THIS CANDIDATE:
            ${resumeText.substring(0, 10000)}
            
            USER CONTEXT/PREFERENCES:
            "${preferences}"

            YOUR TASK:
            Identify 5 distinct career opportunities for this candidate based on their skills, the current market, and potential pivots.
            
            Use professional, standard business English. Avoid jargon or overly metaphorical language.
            
            MUST GENERATE 5 ROLES, ONE OF EACH TYPE:
            1. "Lateral" (Immediate fit, similar to current)
            2. "Promotion" (Step up in same path)
            3. "Pivot" (Different industry/role utilizing transferrable skills)
            4. "Moonshot" (High risk, high reward, requires upskilling)
            5. "Wildcard" (Unexpected but data-backed fit)

            For each role, estimate Salary, Market Demand, and concrete Skills Gap.
            
            RETURN JSON ONLY in this format:
            {
              "archetype": "Two-word professional profile (e.g. 'Systems Architect')",
              "keyStrengths": ["Strength 1", "Strength 2", "Strength 3"],
              "marketValue": "Estimated Salary Range (e.g. $120k - $160k)",
              "opportunities": [
                {
                  "id": "1",
                  "type": "Lateral",
                  "role": "Job Title",
                  "companyType": "e.g. 'Series C FinTech' or 'Enterprise SaaS'",
                  "matchScore": 95,
                  "salaryRange": "$140k - $160k",
                  "timeToRole": "Immediate",
                  "skillsGap": ["None"],
                  "skillsMatch": ["React", "Node", "Leadership"],
                  "marketDemand": "High",
                  "rationale": "One clear sentence explaining why this is a good fit.",
                  "actionPlan": ["Update LinkedIn", "Apply to top 5 firms"],
                  "coordinates": { "x": 0, "y": 0, "z": 0 }
                },
                ... (4 more)
              ]
            }
            `;

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    tools: [{ googleSearch: {} }] // Use Search for salary data
                }
            });

            const text = cleanJson(response.text);
            const data = JSON.parse(text);
            
            data.opportunities = data.opportunities.map((opp: any, i: number) => {
                let x = 0, y = 0, z = 0;
                const angle = (i / 5) * Math.PI * 2;
                const radius = (100 - opp.matchScore) * 3;
                x = Math.cos(angle) * radius;
                z = Math.sin(angle) * radius;
                y = (Math.random() - 0.5) * 40;
                
                return {
                    ...opp,
                    id: opp.id || i.toString(),
                    coordinates: { x, y, z }
                };
            });

            return data;
        });
    };

    try {
        return await runAnalysis('gemini-3-pro-preview');
    } catch (e) {
        if (isRateLimitError(e)) return await runAnalysis('gemini-2.5-flash');
        throw e;
    }
};

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

export const findLatestOpportunities = async (role: string, loc: string, visaStatus: string = 'Citizen/PR', mode: 'standard' | 'stealth' = 'standard') => {
    return executeWithRetry(async (ai) => {
        const today = new Date().toISOString().split('T')[0];
        
        // Construct Strict Visa-Specific Query Parts
        let visaInstruction = '';
        if (visaStatus.includes('Sponsorship') || visaStatus.includes('482') || visaStatus.includes('TSS')) {
            visaInstruction = 'CRITICAL: The candidate requires VISA SPONSORSHIP. Filter out any job that says "Must be a citizen", "PR only", or "No sponsorship". Look for "visa sponsorship available". If uncertain, mark visaStatus as "Unknown".';
        } else if (visaStatus.includes('Student') || visaStatus.includes('Graduate')) {
            visaInstruction = 'CRITICAL: Candidate is on a Student/Graduate visa. Prioritize roles allowing part-time or graduate programs.';
        } else {
            visaInstruction = 'Candidate is likely a Citizen/PR. Standard rules apply.';
        }

        const prompt = `
            ACT AS AN ELITE EXECUTIVE RECRUITER.
            TODAY'S DATE: ${today}
            
            TASK: Find exactly 10 HIGH-QUALITY, REAL job openings. Quality over quantity.
            
            PARAMETERS:
            - ROLE: "${role}"
            - LOCATION: "${loc}" (or Remote if applicable)
            - MODE: ${mode.toUpperCase()}
            
            ${visaInstruction}

            STRICT RULES FOR 100% SUCCESS RATE:
            1. **NO BROKEN LINKS**: You MUST verify the URL. 
               - Priority 1: Direct ATS links (greenhouse.io, lever.co, ashbyhq.com, workable.com).
               - Priority 2: Company Career Pages.
               - **FAIL-SAFE**: If you find a job but cannot guarantee the direct URL is stable, you MUST construct a Google Search URL as the 'url' field. 
                 Example: "https://www.google.com/search?q=${encodeURIComponent(role)}+at+${encodeURIComponent("COMPANY_NAME")}+careers".
                 This ensures the user never gets a 404 error.
            
            2. **FRESHNESS**: 
               - Only include jobs posted within the last 14 days.
               - If it looks old, discard it.
            
            3. **ACCURACY**:
               - Title must match "${role}" closely.
               - Location must match "${loc}".

            RETURN JSON ARRAY (Exactly 10 items):
            [
              {
                "id": "unique_string",
                "title": "Exact Job Title",
                "company": "Company Name",
                "url": "Direct URL OR Fallback Google Search URL",
                "location": "City, Country",
                "timestamp": "e.g. '2 days ago'",
                "isNew": true,
                "visaStatus": "Sponsorship Available" | "Citizen Only" | "Unknown"
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
            if (!Array.isArray(res)) return [];
            
            // Post-processing to sanitize and ensure 100% working links via fallback logic
            return res.slice(0, 10).map((job: any) => {
                let finalUrl = job.url;
                // If URL looks suspicious or generic, force a search fallback
                if (!finalUrl || finalUrl.length < 10 || finalUrl.includes('example.com') || !finalUrl.startsWith('http')) {
                    finalUrl = `https://www.google.com/search?q=${encodeURIComponent(job.company + " " + job.title + " careers")}`;
                }

                return {
                    ...job,
                    id: job.id || `job-${Math.random().toString(36).substr(2, 9)}`,
                    title: job.title || 'Untitled Opportunity',
                    company: job.company || 'Unknown Company',
                    url: finalUrl,
                    timestamp: job.timestamp || 'Recently',
                    visaStatus: job.visaStatus || 'Unknown'
                };
            });
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

export const generateMagnumOpus = async (resumeData: FileData | string, jobDescription: string): Promise<ProjectArtifact> => {
    const instruction = `
        Act as a legendary Distinguished Engineer and Software Architect.
        
        GOAL: Architect and implement a "Magnum Opus" project (Bridge Project) for a candidate.
        This project must bridge the skill gap between the CANDIDATE RESUME and the TARGET JOB DESCRIPTION by implementing the *hardest* requirements of the job.
        
        CRITICAL OUTPUT REQUIREMENTS:
        
        1. **Documentation (README.md)**:
           - Write a Master-Class Technical Design Document (TDD) as the README.
           - Include: Executive Summary, Architecture Decision Records (ADRs) explaining WHY certain tech was chosen (CAP theorem, trade-offs), Scalability Strategy (Sharding, Caching patterns), and Security Posture (RBAC, Encryption).
           - Tone: Professional, authoritative, visionary.
        
        2. **Source Code (PRODUCTION GRADE)**:
           - Generate a FULLY FUNCTIONAL, MVP version of the core system.
           - DO NOT generate placeholders like "// logic here" or "TODO". Write the ACTUAL ALGORITHMS and LOGIC.
           - Create at least 5-7 core files (e.g., api/controller.ts, services/businessLogic.ts, config/db.ts, frontend/Dashboard.tsx, infrastructure/docker-compose.yml).
           - Use modern, impressive patterns (e.g., Domain-Driven Design, Hexagonal Architecture, React Hooks/Context, Rust Traits).
           - Code must include error handling, type definitions, and comments explaining complex sections.
        
        3. **Blueprint (Architecture Diagram)**:
           - Generate a complex Mermaid.js chart (C4 Level 2 Container or Level 3 Component diagram).
           - Show microservices, databases, message queues (Kafka/RabbitMQ), caches (Redis), Load Balancers, and external API integrations.
           - Use subgraphs to organize the visual layout.
           - **STRICT MERMAID SYNTAX**: 
             - Enclose ALL node labels in double quotes. Example: \`id["Label (Detail)"]\`. 
             - Do NOT use unquoted parentheses inside node definitions.
             - Ensure all subgraphs are properly closed with \`end\`.

        TARGET JOB DESCRIPTION: ${jobDescription.substring(0, 2000)}
        
        RETURN JSON ONLY matching this schema:
        {
            "id": "project-uuid",
            "title": "Project Name (e.g. 'Helios: Distributed Neural Sync Engine')",
            "tagline": "A punchy, impressive one-liner describing the system.",
            "description": "Executive summary of the project.",
            "techStack": ["Rust", "GraphQL", "Kubernetes", "Kafka", "React"],
            "features": ["Feature 1", "Feature 2"],
            "readmeContent": "# Title\\n\\n## Architecture... ",
            "fileTree": [
                { "name": "src", "type": "folder", "children": [{ "name": "App.tsx", "type": "file" }] }
            ],
            "codeFiles": [
                { "name": "src/main.rs", "language": "rust", "content": "fn main() { ... }" },
                { "name": "k8s/deployment.yaml", "language": "yaml", "content": "..." }
            ],
            "architectureDiagram": "graph TB\\n..." 
        }
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

    try {
        return await executeWithRetry(async (ai) => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: contents },
                config: {
                    responseMimeType: 'application/json',
                    thinkingConfig: { thinkingBudget: 16000 } 
                }
            });
            return JSON.parse(cleanJson(response.text));
        });
    } catch (e: any) {
        if (isRateLimitError(e)) {
            console.warn("Magnum Opus: Pro model exhausted. Falling back to Flash.");
            return await executeWithRetry(async (ai) => {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: contents },
                    config: {
                        responseMimeType: 'application/json'
                    }
                });
                return JSON.parse(cleanJson(response.text));
            });
        }
        throw e;
    }
};

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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        return JSON.parse(cleanJson(response.text));
    });
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
                **IMPORTANT SYNTAX RULE**: Quote all node labels that contain special characters or spaces. Example: A["Client (Mobile)"].
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

// ... existing types ...
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MapLocation {
  title: string;
  uri: string;
  rating?: number;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  THE_ARCHITECT = 'the-architect',
  PROOF_OF_WORK = 'proof-of-work', 
  RESUME_FORGE = 'resume-forge',
  CAREER_PATHFINDER = 'career-pathfinder',
  APPLICATION_TRACKER = 'application-tracker',
  HEADHUNTER = 'headhunter',
  COMPANY_RECON = 'company-recon',
  HEADSHOT_STUDIO = 'headshot-studio',
  VIDEO_PITCH = 'video-pitch',
  BRAND_ASSETS = 'brand-assets',
  INTERVIEW_COACH = 'interview-coach',
  TRUST_CENTER = 'trust-center',
  OUTREACH_NEXUS = 'outreach-nexus',
  LINKEDIN_ARCHITECT = 'linkedin-architect',
  CHRONO_LAPSE = 'chrono-lapse',
  THE_TRIBUNAL = 'the-tribunal',
  RESONANCE_ENGINE = 'resonance-engine',
  NEGOTIATION_COACH = 'negotiation-coach',
  SYSTEM_ARCHITECT = 'system-architect',
  SETTINGS = 'settings',
}

// NEW: Career Stages for Dynamic UI
export type CareerStage = 'preparation' | 'discovery' | 'outreach' | 'application' | 'interview' | 'negotiation';

// THE ARCHITECT TYPES
export interface ProjectArtifact {
    id: string;
    title: string;
    tagline: string;
    description: string;
    techStack: string[];
    features: string[];
    readmeContent: string;
    fileTree: { name: string; type: 'file' | 'folder'; children?: any[] }[];
    codeFiles: { name: string; language: string; content: string }[];
    architectureDiagram: string; // Mermaid
}

// ... existing interfaces (WorkChallenge, WorkSubmission) ...
export interface WorkChallenge {
    id: string;
    role: string;
    company: string;
    title: string;
    context: string;
    taskDescription: string;
    deliverableFormat: string;
    timeLimit: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
}

export interface WorkSubmission {
    challengeId: string;
    userSolution: string;
    grade: number; // 0-100
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    emailHook: string; // The text to paste in an email
}

export interface FileData {
  inlineData?: {
    data: string;
    mimeType: string;
  };
  text?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  title: string;
  clearanceLevel?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  atsScore?: number;
  currentStage: CareerStage; // NEW
}

export interface SavedDocument {
  id: string;
  title: string;
  content: string;
  type: 'resume' | 'cover_letter';
  createdAt: string;
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  url: string;
  timestamp: string;
  isNew?: boolean;
  snippet?: string;
}

export type ApplicationStatus = 'target' | 'applied' | 'interview' | 'offer' | 'archived';

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  dateAdded: string;
  notes?: string;
}

// Resume Builder Types
export interface ResumeExperience {
  id: string;
  role: string;
  company: string;
  dates: string;
  description: string; // Markdown supported
}

export interface ResumeEducation {
  id: string;
  school: string;
  degree: string;
  year: string;
}

export interface ResumeData {
  fullName: string;
  title: string;
  contactInfo: string; // Email | Phone | LinkedIn
  summary: string;
  skills: string; // Comma separated
  experience: ResumeExperience[];
  education: ResumeEducation[];
}

export interface DeepResumeAnalysis {
    score: number;
    summaryCritique: string;
    missingKeywords: string[];
    sections: { name: string; score: number; feedback: string; suggestion: string }[];
    tailoredSummary: string;
}

export interface KeyPerson {
    name: string;
    title: string;
    relevance: string;
}

export interface OutreachSequence {
    psychologicalProfile: string;
    hookStrategy: string;
    steps: { step: number; channel: string; subject?: string; content: string; whyItWorks: string }[];
}

export interface CareerRoadmap {
    currentLevel: string;
    targetLevel: string;
    estimatedVelocity: string;
    phases: { title: string; duration: string; focus: string; actions: string[] }[];
}

// Company Recon Types
export interface IntelMetric {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface CompanyDossier {
  companyName: string;
  summary: string;
  financials: IntelMetric[];
  leadership: { name: string; title: string }[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  cultureDecoder: string; // Analysis of values/interview style
  recentNews: { headline: string; sentiment: 'positive' | 'negative' | 'neutral'; url?: string }[];
  sources: GroundingSource[];
  locations?: MapLocation[];
}

// LinkedIn Types
export interface LinkedInProfileStrategy {
  score: number;
  headlineOptions: string[];
  aboutSection: string;
  bannerIdea: string;
  featuredSectionStrategy: string[];
}

export interface LinkedInPost {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  imagePrompt: string;
}

// Chrono-Lapse Types
export interface TimeArtifact {
    type: 'email' | 'news' | 'slack' | 'award';
    title: string;
    content: string; // The body of the artifact
    sender?: string; // For emails/slack
    date: string;
}

export interface TimeNode {
    year: number;
    title: string;
    description: string;
    sentiment: 'growth' | 'stagnation' | 'pivot' | 'danger';
    marketContext: string; // "AI replaces junior devs", "Crypto crash", etc.
    artifact: TimeArtifact;
}

export interface FutureSimulation {
    company: string;
    role: string;
    probabilityScore: number; // Success probability
    timeline: TimeNode[];
    finalOutcome: string;
}

// Tribunal Types
export interface TribunalMember {
    id: string;
    role: 'Hiring Manager' | 'Skeptic Peer' | 'Gatekeeper HR';
    name: string;
    avatarInitials: string;
    hiddenAgenda: string; // e.g., "Worried about budget", "Hates job hoppers"
}

export interface TribunalComment {
    memberId: string;
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    timestamp: string;
    referencesResume?: boolean;
}

export interface TribunalSession {
    company: string;
    role: string;
    members: TribunalMember[];
    transcript: TribunalComment[];
    finalVerdict: 'HIRE' | 'NO_HIRE' | 'MAYBE';
    verdictReason: string;
}

// Resonance Engine Types (UPDATED)
export interface ResonanceSkill {
    name: string;
    category: 'harmonic' | 'dissonant' | 'emergent'; // Harmonic = strong match, Dissonant = blocker, Emergent = future need
    gapLevel: number; // 0-100
}

export interface ResonanceOpportunity {
    id: string;
    role: string;
    companyType: string; // "Enterprise", "Series A", "Agency"
    matchScore: number; // 0-100
    salaryRange: string; // "$150k - $220k"
    timeToRole: string; // "3 months"
    skillsGap: string[];
    skillsMatch: string[];
    marketDemand: 'Explosive' | 'High' | 'Stable' | 'Declining';
    rationale: string;
    actionPlan: string[];
    coordinates: { x: number; y: number; z: number }; // 3D position
    type: 'Lateral' | 'Promotion' | 'Pivot' | 'Moonshot';
}

export interface ResonanceAnalysis {
    archetype: string;
    keyStrengths: string[];
    marketValue: string;
    opportunities: ResonanceOpportunity[];
}

// Networking CRM Types
export interface ContactInteraction {
    id: string;
    date: string;
    type: 'Email' | 'LinkedIn' | 'Call' | 'Coffee' | 'Event';
    notes: string;
}

export interface NetworkContact {
    id: string;
    name: string;
    company: string;
    role: string;
    status: 'Cold' | 'Warm' | 'Hot' | 'Advocate';
    lastContactDate: string;
    interactions: ContactInteraction[];
    email?: string;
    linkedIn?: string;
    notes?: string;
}

// Negotiation Coach Types
export interface NegotiationAnalysis {
    marketRateAnalysis: string;
    leverageAssessment: string;
    strategy: string;
    recommendedCounter: {
        base: string;
        equity: string;
        signOn: string;
    };
    script: string;
}

export interface WarRoomAnalysis {
    summary: string;
    keyConsiderations: string[];
    diagramCode: string; // Mermaid code
    diagramType: string;
}

// Interview Coach Types
export interface BehaviorMetrics {
    confidence: number;
    eyeContact: 'Good' | 'Fair' | 'Poor';
    posture: 'Open' | 'Closed' | 'Neutral';
    feedback: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  
  interface Window {
    aistudio?: AIStudio;
  }
}

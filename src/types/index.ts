export type AdLabel = 'winner' | 'loser' | 'neutral'

export type AdFormat = 'video' | 'image' | 'carousel' | 'ugc'

export interface AdMetrics {
  hookRate?: number
  holdRate?: number
  ctr?: number
  cvr?: number
  cpa?: number
  roas?: number
  spend?: number
}

export interface Ad {
  id: string
  userId: string
  title: string
  format: AdFormat
  label: AdLabel
  metrics: AdMetrics
  fileUrl?: string
  thumbnailUrl?: string
  analysis?: AdAnalysis
  createdAt: string
  updatedAt: string
}

export interface AdAnalysis {
  hook: HookAnalysis
  hold: HoldAnalysis
  conversion: ConversionAnalysis
  buildingBlocks: BuildingBlock[]
  recommendations: string[]
  overallScore: number
}

export interface HookAnalysis {
  score: number
  type: string
  pattern: string
  strengths: string[]
  weaknesses: string[]
}

export interface HoldAnalysis {
  score: number
  techniques: string[]
  pacing: string
  narrative: string
}

export interface ConversionAnalysis {
  score: number
  cta: string
  offer: string
  urgency: string
  socialProof: string[]
}

export interface BuildingBlock {
  id: string
  type: 'hook' | 'body' | 'cta' | 'visual' | 'audio'
  label: string
  description: string
  performance: 'high' | 'medium' | 'low'
  adIds: string[]
}

export interface Script {
  id: string
  userId: string
  title: string
  content: string
  adId?: string
  platform: 'meta' | 'tiktok' | 'youtube' | 'google'
  duration?: number
  createdAt: string
}

export interface Brief {
  id: string
  userId: string
  title: string
  objective: string
  targetAudience: string
  keyMessages: string[]
  toneVoice: string
  deliverables: string[]
  deadline?: string
  createdAt: string
}

export interface Product {
  id: string
  userId: string
  name: string
  description: string
  benefits: string[]
  features: string[]
  targetAudience: string
  usp: string
  createdAt: string
}

export interface TestingExperiment {
  id: string
  userId: string
  name: string
  hypothesis: string
  variable: string
  control: string
  variants: string[]
  status: 'draft' | 'running' | 'completed'
  results?: ExperimentResults
  createdAt: string
}

export interface ExperimentResults {
  winner?: string
  confidence: number
  metrics: Record<string, number>
  insights: string[]
}

export interface PortfolioMix {
  winners: number
  testing: number
  new: number
}

export interface DashboardStats {
  totalAds: number
  activeWinners: number
  buildingBlocksValidated: number
  recentAnalyses: Ad[]
  portfolioMix: PortfolioMix
}

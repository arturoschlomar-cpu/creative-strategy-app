import { create } from 'zustand'
import type { Ad, DashboardStats } from '@/types'

interface AppState {
  ads: Ad[]
  stats: DashboardStats | null
  isLoading: boolean
  setAds: (ads: Ad[]) => void
  setStats: (stats: DashboardStats) => void
  setLoading: (loading: boolean) => void
  addAd: (ad: Ad) => void
}

export const useAppStore = create<AppState>((set) => ({
  ads: [],
  stats: null,
  isLoading: false,
  setAds: (ads) => set({ ads }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  addAd: (ad) => set((state) => ({ ads: [ad, ...state.ads] })),
}))

import { create } from 'zustand'
import { AI_PROVIDERS, DEFAULT_PROVIDER } from '../constants/aiProviders'

const STORAGE_KEY = 'ai_settings'

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

const saved = loadSettings()

export const useAIStore = create((set, get) => ({
  // Settings
  providerId: saved?.providerId || DEFAULT_PROVIDER.id,
  apiKey: saved?.apiKey || '',
  model: saved?.model || DEFAULT_PROVIDER.defaultModel,
  baseUrl: saved?.baseUrl || DEFAULT_PROVIDER.defaultBaseUrl,
  customModel: saved?.customModel || '',
  enabled: saved?.enabled || false,

  // AI feature toggles - user controls which features use AI
  features: {
    suggestSummary: saved?.features?.suggestSummary ?? true,
    suggestExperience: saved?.features?.suggestExperience ?? true,
    suggestSkills: saved?.features?.suggestSkills ?? true,
    improveContent: saved?.features?.improveContent ?? true,
    translateCV: saved?.features?.translateCV ?? true,
    ...saved?.features,
  },

  // Status
  loading: false,
  error: null,

  // Getters
  getProvider: () => AI_PROVIDERS.find((p) => p.id === get().providerId) || DEFAULT_PROVIDER,
  isConfigured: () => {
    const { apiKey, baseUrl, model } = get()
    return !!(apiKey && baseUrl && (model || get().customModel))
  },

  // Actions
  setProvider: (providerId) => {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId) || DEFAULT_PROVIDER
    const newSettings = {
      providerId: provider.id,
      apiKey: get().apiKey,
      model: provider.defaultModel,
      baseUrl: provider.defaultBaseUrl,
      customModel: get().customModel,
      enabled: get().enabled,
      features: get().features,
    }
    saveSettings(newSettings)
    set({ providerId: provider.id, model: provider.defaultModel, baseUrl: provider.defaultBaseUrl })
  },

  setApiKey: (key) => {
    const newSettings = { providerId: get().providerId, apiKey: key, model: get().model, baseUrl: get().baseUrl, customModel: get().customModel, enabled: get().enabled, features: get().features }
    saveSettings(newSettings)
    set({ apiKey: key })
  },

  setModel: (model) => {
    const newSettings = { providerId: get().providerId, apiKey: get().apiKey, model, baseUrl: get().baseUrl, customModel: get().customModel, enabled: get().enabled, features: get().features }
    saveSettings(newSettings)
    set({ model })
  },

  setBaseUrl: (url) => {
    const newSettings = { providerId: get().providerId, apiKey: get().apiKey, model: get().model, baseUrl: url, customModel: get().customModel, enabled: get().enabled, features: get().features }
    saveSettings(newSettings)
    set({ baseUrl: url })
  },

  setCustomModel: (model) => {
    const newSettings = { providerId: get().providerId, apiKey: get().apiKey, model: get().model, baseUrl: get().baseUrl, customModel: model, enabled: get().enabled, features: get().features }
    saveSettings(newSettings)
    set({ customModel: model })
  },

  setEnabled: (enabled) => {
    const newSettings = { providerId: get().providerId, apiKey: get().apiKey, model: get().model, baseUrl: get().baseUrl, customModel: get().customModel, enabled, features: get().features }
    saveSettings(newSettings)
    set({ enabled })
  },

  toggleFeature: (feature) => {
    const features = { ...get().features, [feature]: !get().features[feature] }
    const newSettings = { providerId: get().providerId, apiKey: get().apiKey, model: get().model, baseUrl: get().baseUrl, customModel: get().customModel, enabled: get().enabled, features }
    saveSettings(newSettings)
    set({ features })
  },

  getActiveModel: () => {
    const { model, customModel } = get()
    return customModel || model
  },
}))

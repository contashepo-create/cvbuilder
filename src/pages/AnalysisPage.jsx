import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCVStore } from '../store/cvStore'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { analyzeCV } from '../lib/atsEngine'
import Spinner from '../components/ui/Spinner'
import {
  ArrowLeft, ScanSearch, CheckCircle2, AlertCircle, AlertTriangle, XCircle,
  TrendingUp, Shield, Target,
} from 'lucide-react'

const STATUS_CONFIG = {
  excellent: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500' },
  good: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', bar: 'bg-yellow-500' },
  critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' },
}

export default function AnalysisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { currentCV, loading, loadCV } = useCVStore()
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(true)

  useEffect(() => {
    loadCV(id)
  }, [id, loadCV])

  useEffect(() => {
    if (currentCV) {
      runAnalysis()
    }
  }, [currentCV])

  const runAnalysis = async () => {
    setAnalyzing(true)
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 500))
    const result = analyzeCV(currentCV.content, i18n.language)
    setAnalysis(result)

    // Save to database (skip in demo mode)
    if (!DEMO_MODE) {
      try {
        await supabase.from('cv_analyses').insert({
          cv_id: currentCV.id,
          score: result.score,
        analysis: result,
        })
      } catch (err) {
        console.error('Failed to save analysis:', err)
      }
    }

    setAnalyzing(false)
  }

  if (loading || !currentCV) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    )
  }

  if (analyzing || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ScanSearch size={48} className="text-primary-600 animate-pulse mb-4" />
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[analysis.sections.personalInfo?.status] || STATUS_CONFIG.warning

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('analysis.title')}</h1>
          <p className="text-gray-500">{currentCV.title}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runAnalysis} className="btn-outline text-sm">
            <ScanSearch size={18} /> {t('analysis.recheck')}
          </button>
          <button onClick={() => navigate(`/builder/${id}`)} className="btn-secondary text-sm">
            <ArrowLeft size={18} /> {t('analysis.back_to_builder')}
          </button>
        </div>
      </div>

      {/* Score Circle */}
      <div className="card text-center mb-6">
        <div className="relative inline-flex items-center justify-center mb-4">
          <svg className="w-36 h-36 -rotate-90">
            <circle cx="72" cy="72" r="64" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="72" cy="72" r="64" fill="none"
              stroke={analysis.score >= 70 ? '#16a34a' : analysis.score >= 50 ? '#eab308' : '#dc2626'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(analysis.score / 100) * 402} 402`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold">{analysis.score}</span>
            <span className="text-sm text-gray-500">/ 100</span>
            <span className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full bg-gray-100">Grade: {analysis.grade}</span>
          </div>
        </div>
      </div>

      {/* General Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={Target}
          label={t('analysis.completeness')}
          value={analysis.general.completeness}
        />
        <MetricCard
          icon={Shield}
          label={t('analysis.ats_compatible')}
          value={analysis.general.atsCompatibility}
        />
        <MetricCard
          icon={TrendingUp}
          label={t('analysis.keyword_strength')}
          value={analysis.general.keywordStrength}
        />
      </div>

      {/* Section Scores */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">{t('common.section_scores')}</h2>
        <div className="space-y-3">
          {Object.entries(analysis.sections).map(([sectionId, result]) => {
            const config = STATUS_CONFIG[result.status] || STATUS_CONFIG.warning
            const Icon = config.icon
            const sectionKey = sectionId === 'personalInfo' ? 'personal_info' : sectionId
            return (
              <div key={sectionId} className="flex items-center gap-3">
                <Icon size={20} className={config.color} />
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium">{t(`builder.sections.${sectionKey}`)}</span>
                    <span className="text-sm text-gray-500">{result.score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${config.bar}`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tips per section */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">{t('analysis.tips')}</h2>
        <div className="space-y-4">
          {Object.entries(analysis.sections).map(([sectionId, result]) => {
            if (!result.tips?.length) return null
            const sectionKey = sectionId === 'personalInfo' ? 'personal_info' : sectionId
            return (
              <div key={sectionId}>
                <h3 className="text-sm font-medium text-gray-700 mb-1">{t(`builder.sections.${sectionKey}`)}</h3>
                <ul className="space-y-1">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2 ps-4">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="card">
        <h2 className="font-semibold mb-4">{t('analysis.recommendations')}</h2>
        {analysis.recommendations.length === 0 ? (
          <p className="text-green-600 flex items-center gap-2">
            <CheckCircle2 size={18} /> {t('analysis.no_recommendations')}
          </p>
        ) : (
          <div className="space-y-2">
            {analysis.recommendations.map((rec, i) => {
              const config = rec.type === 'critical' ? STATUS_CONFIG.critical :
                            rec.type === 'improvement' ? STATUS_CONFIG.warning :
                            { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' }
              const Icon = config.icon
              return (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-lg ${config.bg}`}>
                  <Icon size={18} className={`${config.color} flex-shrink-0 mt-0.5`} />
                  <span className={`text-sm ${config.color}`}>{rec.message}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="card text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-600 mb-2">
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold mb-1">{value}%</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

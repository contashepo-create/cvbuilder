import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCVStore } from '../store/cvStore'
import { useAuthStore } from '../store/authStore'
import { BUILDER_STEPS, FIXED_STEPS } from '../constants/sections'
import { getCVLabels } from '../components/builder/templates/cvHelpers'
import Spinner from '../components/ui/Spinner'
import TemplatePicker from '../components/builder/TemplatePicker'
import TemplateRenderer from '../components/builder/templates/TemplateRenderer'
import PersonalInfoStep from '../components/builder/steps/PersonalInfoStep'
import SummaryStep from '../components/builder/steps/SummaryStep'
import ExperienceStep from '../components/builder/steps/ExperienceStep'
import EducationStep from '../components/builder/steps/EducationStep'
import SkillsStep from '../components/builder/steps/SkillsStep'
import LanguagesStep from '../components/builder/steps/LanguagesStep'
import CertificationsStep from '../components/builder/steps/CertificationsStep'
import ProjectsStep from '../components/builder/steps/ProjectsStep'
import SectionOrderStep from '../components/builder/steps/SectionOrderStep'
import { exportToPDF } from '../lib/pdfExport'
import AISettingsModal from '../components/settings/AISettingsModal'
import { useAIStore } from '../store/aiStore'
import {
  ChevronLeft, ChevronRight, Save, ScanSearch, Download, Check,
  Eye, Pencil, X, Loader2, AlertTriangle, Sparkles,
} from 'lucide-react'

const stepComponents = {
  personalInfo: PersonalInfoStep,
  summary: SummaryStep,
  experience: ExperienceStep,
  education: EducationStep,
  skills: SkillsStep,
  languages: LanguagesStep,
  certifications: CertificationsStep,
  projects: ProjectsStep,
  sectionOrder: SectionOrderStep,
}

export default function BuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { currentCV, loading, loadCV, updateContent, updateTemplate, saveCV, saveStatus, cheatWarning } = useCVStore()
  const { profile } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [title, setTitle] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [showAISettings, setShowAISettings] = useState(false)
  const saveTimer = useRef(null)
  const cvRef = useRef(null)

  useEffect(() => {
    loadCV(id)
  }, [id, loadCV])

  useEffect(() => {
    if (currentCV) setTitle(currentCV.title)
  }, [currentCV])

  const content = currentCV?.content

  const handleContentChange = useCallback((sectionId, value) => {
    if (!content) return
    const newContent = { ...content, [sectionId]: value }
    updateContent(newContent)

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveCV(profile)
    }, 2000)
  }, [content, updateContent, saveCV, profile])

  const handleSectionOrderChange = (newOrder) => {
    handleContentChange('sectionOrder', newOrder)
  }

  const handleTemplateChange = (templateId) => {
    updateTemplate(templateId)
    saveCV(profile)
    setShowTemplatePicker(false)
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
  }

  const handleTitleBlur = () => {
    if (currentCV) {
      useCVStore.setState((state) => ({
        currentCV: { ...state.currentCV, title },
      }))
      saveCV(profile)
    }
  }

  const handleExport = async (fitToOnePage = false) => {
    if (!cvRef.current) return
    setExporting(true)
    setShowExportOptions(false)
    try {
      const filename = `${(title || 'CV').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      await exportToPDF(cvRef.current, filename, fitToOnePage)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading || !currentCV) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    )
  }

  const step = BUILDER_STEPS[currentStep] || FIXED_STEPS[0]
  const cvLabels = getCVLabels(content?.cvLanguage || 'ar')
  const StepComponent = stepComponents[step.id]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === BUILDER_STEPS.length - 1

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2 flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          className="text-sm font-medium border-none focus:outline-none focus:ring-0 px-2 py-1 rounded hover:bg-gray-50 focus:bg-gray-50"
          placeholder={t('dashboard.untitled')}
        />

        <div className="flex-1" />

        <div className="flex items-center gap-2 flex-wrap">
          {saveStatus === 'saving' && <span className="text-xs text-gray-400">{t('builder.saving')}</span>}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check size={14} /> {t('builder.saved')}
            </span>
          )}
          <button onClick={() => setShowPreview(!showPreview)} className="btn-outline text-sm">
            {showPreview ? <><Pencil size={16} /> {isRTL ? 'تحرير' : 'Edit'}</> : <><Eye size={16} /> {t('builder.preview')}</>}
          </button>
          <button onClick={() => setShowTemplatePicker(true)} className="btn-outline text-sm">
            {t('builder.select_template')}
          </button>
          <button
            onClick={() => setShowAISettings(true)}
            className={`btn text-sm ${useAIStore.getState().enabled && useAIStore.getState().isConfigured() ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={isRTL ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
          >
            <Sparkles size={16} />
            AI
          </button>
          <button onClick={() => navigate(`/analysis/${id}`)} className="btn-secondary text-sm">
            <ScanSearch size={16} /> {t('builder.analyze')}
          </button>
          <button onClick={() => saveCV(profile)} className="btn-primary text-sm">
            <Save size={16} /> {t('builder.save')}
          </button>
          <div className="relative">
            <button onClick={() => setShowExportOptions(!showExportOptions)} disabled={exporting} className="btn-primary text-sm">
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {t('builder.export_pdf')}
            </button>
            {showExportOptions && (
              <div className="absolute end-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 w-56">
                <button
                  onClick={() => handleExport(false)}
                  className="w-full text-start px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {isRTL ? 'تصدير متعدد الصفحات' : 'Multi-page PDF'}
                </button>
                <button
                  onClick={() => handleExport(true)}
                  className="w-full text-start px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {isRTL ? 'تصدير في صفحة واحدة' : 'Fit to one page'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anti-cheat warning */}
      {cheatWarning && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {cheatWarning.message}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex-1 overflow-y-auto p-6 ${showPreview ? 'hidden lg:block lg:w-1/2' : ''}`}>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
            {BUILDER_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(i)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    i === currentStep
                      ? 'bg-primary-600 text-white'
                      : i < currentStep
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </button>
                {i < BUILDER_STEPS.length - 1 && <div className="w-4 h-px bg-gray-200" />}
              </div>
            ))}
          </div>

          <div className="mb-2">
            <h2 className="text-lg font-semibold">
              {t('builder.step')} {currentStep + 1} {t('builder.of')} {BUILDER_STEPS.length}: {cvLabels[step.key] || step.key}
            </h2>
          </div>

          <div className="card">
            {step.id === 'sectionOrder' ? (
              <SectionOrderStep
                content={content}
                onChange={(newContent) => {
                  updateContent(newContent)
                  if (saveTimer.current) clearTimeout(saveTimer.current)
                  saveTimer.current = setTimeout(() => saveCV(profile), 2000)
                }}
              />
            ) : (
              <StepComponent
                data={content[step.id]}
                onChange={(value) => handleContentChange(step.id, value)}
                cvLanguage={content?.cvLanguage || 'ar'}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={isFirstStep}
              className="btn-secondary"
            >
              {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {t('builder.prev')}
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(BUILDER_STEPS.length - 1, currentStep + 1))}
              disabled={isLastStep}
              className="btn-primary"
            >
              {t('builder.next')}
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className={`border-s border-gray-200 bg-gray-100 overflow-y-auto ${showPreview ? 'w-full lg:w-1/2' : 'hidden lg:block lg:w-1/2'}`}>
          <div className="p-4">
            <div className="cv-printable shadow-lg" ref={cvRef}>
              <TemplateRenderer templateId={currentCV.template_id} content={content} />
            </div>
          </div>
        </div>
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowTemplatePicker(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('builder.select_template')}</h2>
              <button onClick={() => setShowTemplatePicker(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <TemplatePicker selectedId={currentCV.template_id} onSelect={handleTemplateChange} />
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      {showAISettings && (
        <AISettingsModal onClose={() => setShowAISettings(false)} />
      )}
    </div>
  )
}

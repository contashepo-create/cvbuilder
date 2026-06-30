import ModernTemplate from './ModernTemplate'
import ClassicTemplate from './ClassicTemplate'
import MinimalTemplate from './MinimalTemplate'
import ProfessionalTemplate from './ProfessionalTemplate'
import CreativeTemplate from './CreativeTemplate'

const templateMap = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
}

export default function TemplateRenderer({ templateId, content }) {
  const Template = templateMap[templateId] || ModernTemplate
  return <Template content={content} />
}

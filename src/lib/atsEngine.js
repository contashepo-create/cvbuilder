/**
 * ATS (Applicant Tracking System) Analysis Engine
 * Analyzes CV content and returns a comprehensive score with tips.
 */

const ACTION_VERBS = [
  'managed', 'developed', 'achieved', 'led', 'created', 'implemented',
  'designed', 'built', 'launched', 'improved', 'increased', 'decreased',
  'optimized', 'automated', 'coordinated', 'established', 'negotiated',
  'analyzed', 'resolved', 'streamlined', 'spearheaded', 'orchestrated',
  'delivered', 'executed', 'founded', 'generated', 'produced', 'directed',
  'supervised', 'mentored', 'trained', 'presented', 'researched',
  'collaborated', 'facilitated', 'initiated', 'transformed', 'revamped',
  'engineered', 'architected', 'deployed', 'maintained', 'integrated',
  'migrated', 'upgraded', 'configured', 'administered', 'audited',
  'إدارة', 'تطوير', 'تحقيق', 'قيادة', 'إنشاء', 'تنفيذ', 'تصميم', 'بناء',
  'إطلاق', 'تحسين', 'زيادة', 'تحليل', 'حل', 'تطوير', 'تنسيق', 'تأسيس',
]

const REQUIRED_SECTIONS = ['personalInfo', 'summary', 'experience', 'education', 'skills']

/**
 * Main analysis function
 * @param {Object} content - CV content object
 * @param {string} lang - 'ar' or 'en'
 * @returns {Object} analysis result
 */
export function analyzeCV(content, lang = 'en') {
  const sections = {}
  let totalScore = 0
  let sectionCount = 0

  // Personal Info
  const personalScore = analyzePersonalInfo(content.personalInfo, lang)
  sections.personalInfo = personalScore
  totalScore += personalScore.score
  sectionCount++

  // Summary
  const summaryScore = analyzeSummary(content.summary, lang)
  sections.summary = summaryScore
  totalScore += summaryScore.score
  sectionCount++

  // Experience
  const expScore = analyzeExperience(content.experience, lang)
  sections.experience = expScore
  totalScore += expScore.score
  sectionCount++

  // Education
  const eduScore = analyzeEducation(content.education, lang)
  sections.education = eduScore
  totalScore += eduScore.score
  sectionCount++

  // Skills
  const skillsScore = analyzeSkills(content.skills, lang)
  sections.skills = skillsScore
  totalScore += skillsScore.score
  sectionCount++

  // Languages (optional)
  if (content.languages?.length > 0) {
    const langScore = analyzeLanguages(content.languages, lang)
    sections.languages = langScore
    totalScore += langScore.score
    sectionCount++
  }

  // Certifications (optional)
  if (content.certifications?.length > 0) {
    const certScore = analyzeCertifications(content.certifications, lang)
    sections.certifications = certScore
    totalScore += certScore.score
    sectionCount++
  }

  // Projects (optional)
  if (content.projects?.length > 0) {
    const projScore = analyzeProjects(content.projects, lang)
    sections.projects = projScore
    totalScore += projScore.score
    sectionCount++
  }

  const overallScore = Math.round(totalScore / sectionCount)

  // General metrics
  const completeness = calculateCompleteness(content)
  const atsCompatibility = calculateATSCompatibility(content)
  const keywordStrength = calculateKeywordStrength(content)

  // Recommendations
  const recommendations = generateRecommendations(content, sections, lang)

  return {
    score: overallScore,
    grade: getGrade(overallScore),
    sections,
    general: {
      completeness,
      atsCompatibility,
      keywordStrength,
    },
    recommendations,
  }
}

function analyzePersonalInfo(info, lang) {
  if (!info) return { score: 0, tips: [lang === 'ar' ? 'أضف معلوماتك الشخصية' : 'Add your personal information'], status: 'critical' }

  let score = 0
  const tips = []
  const maxScore = 100

  if (info.fullName?.trim()) score += 20
  else tips.push(lang === 'ar' ? 'أضف اسمك الكامل' : 'Add your full name')

  if (info.jobTitle?.trim()) score += 15
  else tips.push(lang === 'ar' ? 'أضف المسمى الوظيفي' : 'Add a job title')

  if (info.email?.trim()) score += 15
  else tips.push(lang === 'ar' ? 'أضف بريدك الإلكتروني' : 'Add your email')

  if (info.phone?.trim()) score += 15
  else tips.push(lang === 'ar' ? 'أضف رقم هاتفك' : 'Add your phone number')

  if (info.address?.trim()) score += 10
  else tips.push(lang === 'ar' ? 'أضف عنوانك' : 'Add your address')

  if (info.links?.linkedin?.trim()) score += 10
  else tips.push(lang === 'ar' ? 'أضف رابط LinkedIn' : 'Add a LinkedIn URL')

  if (info.links?.github?.trim()) score += 10
  else tips.push(lang === 'ar' ? 'أضف رابط GitHub (مفيد للمجالات التقنية)' : 'Add a GitHub URL (helpful for tech fields)')

  if (info.links?.website?.trim()) score += 5
  // No tip for website - it's optional

  return { score, tips, status: getStatus(score) }
}

function analyzeSummary(summary, lang) {
  if (!summary?.trim()) {
    return { score: 0, tips: [lang === 'ar' ? 'أضف ملخصاً مهنياً' : 'Add a professional summary'], status: 'critical' }
  }

  const wordCount = summary.trim().split(/\s+/).filter(Boolean).length
  let score = 50
  const tips = []

  if (wordCount >= 30 && wordCount <= 200) {
    score = 100
  } else if (wordCount < 30) {
    score = 50
    tips.push(lang === 'ar' ? 'الملخص قصير جداً، يُفضّل 30-200 كلمة' : 'Summary is too short, aim for 30-200 words')
  } else {
    score = 70
    tips.push(lang === 'ar' ? 'الملخص طويل، يُفضّل ألا يتجاوز 200 كلمة' : 'Summary is too long, keep under 200 words')
  }

  // Check for action verbs
  const lowerSummary = summary.toLowerCase()
  const hasActionVerb = ACTION_VERBS.some((v) => lowerSummary.includes(v.toLowerCase()))
  if (hasActionVerb) score = Math.min(score + 10, 100)
  else tips.push(lang === 'ar' ? 'استخدم أفعالاً قوية مثل: developed, led, achieved' : 'Use strong action verbs like: developed, led, achieved')

  return { score, tips, status: getStatus(score) }
}

function analyzeExperience(experience, lang) {
  if (!experience || experience.length === 0) {
    return { score: 20, tips: [lang === 'ar' ? 'أضف خبراتك العملية' : 'Add your work experience'], status: 'critical' }
  }

  let totalScore = 0
  const tips = []

  experience.forEach((exp) => {
    let itemScore = 0
    if (exp.position?.trim()) itemScore += 20
    else tips.push(lang === 'ar' ? 'أضف المنصب للخبرة' : 'Add position title')

    if (exp.company?.trim()) itemScore += 20
    else tips.push(lang === 'ar' ? 'أضف اسم الشركة' : 'Add company name')

    if (exp.startDate) itemScore += 15
    if (exp.endDate || exp.current) itemScore += 15

    if (exp.description?.trim()) {
      itemScore += 30
      // Check for quantifiable results
      const hasNumbers = /\d+%|\d+\s*(?:users|clients|projects|people|hours|years|months|revenue|sales|k|k\b)/i.test(exp.description)
      if (hasNumbers) itemScore += 10
      else tips.push(lang === 'ar' ? `أضف أرقاماً ونسباً في وصف "${exp.position}" (مثل: زادت المبيعات بنسبة 20%)` : `Add numbers/metrics to "${exp.position}" description (e.g., increased sales by 20%)`)

      // Check for action verbs
      const hasActionVerb = ACTION_VERBS.some((v) => exp.description.toLowerCase().includes(v.toLowerCase()))
      if (!hasActionVerb) tips.push(lang === 'ar' ? `استخدم أفعالاً قوية في وصف "${exp.position}"` : `Use strong action verbs in "${exp.position}" description`)
    } else {
      tips.push(lang === 'ar' ? `أضف وصفاً لمنصب "${exp.position}"` : `Add description for "${exp.position}"`)
    }

    totalScore += Math.min(itemScore, 100)
  })

  const avgScore = Math.round(totalScore / experience.length)
  return { score: avgScore, tips, status: getStatus(avgScore) }
}

function analyzeEducation(education, lang) {
  if (!education || education.length === 0) {
    return { score: 30, tips: [lang === 'ar' ? 'أضف مؤهلاتك التعليمية' : 'Add your education'], status: 'warning' }
  }

  let totalScore = 0
  const tips = []

  education.forEach((edu) => {
    let itemScore = 0
    if (edu.degree?.trim()) itemScore += 30
    else tips.push(lang === 'ar' ? 'أضف الدرجة العلمية' : 'Add degree')

    if (edu.institution?.trim()) itemScore += 30
    else tips.push(lang === 'ar' ? 'أضف اسم المؤسسة التعليمية' : 'Add institution name')

    if (edu.field?.trim()) itemScore += 20
    if (edu.startDate) itemScore += 10
    if (edu.endDate) itemScore += 10

    totalScore += Math.min(itemScore, 100)
  })

  const avgScore = Math.round(totalScore / education.length)
  return { score: avgScore, tips, status: getStatus(avgScore) }
}

function analyzeSkills(skills, lang) {
  if (!skills || skills.length === 0) {
    return { score: 0, tips: [lang === 'ar' ? 'أضف مهاراتك' : 'Add your skills'], status: 'critical' }
  }

  let score = 60
  const tips = []

  if (skills.length >= 5) score = 80
  if (skills.length >= 10) score = 90
  if (skills.length >= 15) score = 100

  // Check for skill names
  const emptySkills = skills.filter((s) => !s.name?.trim())
  if (emptySkills.length > 0) {
    tips.push(lang === 'ar' ? `هناك ${emptySkills.length} مهارة بدون اسم` : `${emptySkills.length} skills without names`)
    score -= 10
  }

  return { score: Math.max(score, 0), tips, status: getStatus(score) }
}

function analyzeLanguages(languages, lang) {
  if (!languages || languages.length === 0) return { score: 0, tips: [], status: 'critical' }

  let score = 70
  const tips = []

  if (languages.length >= 2) score = 90
  if (languages.length >= 3) score = 100

  const emptyNames = languages.filter((l) => !l.name?.trim())
  if (emptyNames.length > 0) {
    score -= 20
    tips.push(lang === 'ar' ? 'بعض اللغات بدون أسماء' : 'Some languages without names')
  }

  return { score: Math.max(score, 0), tips, status: getStatus(score) }
}

function analyzeCertifications(certs, lang) {
  if (!certs || certs.length === 0) return { score: 0, tips: [], status: 'critical' }

  let totalScore = 0
  const tips = []

  certs.forEach((cert) => {
    let itemScore = 0
    if (cert.name?.trim()) itemScore += 40
    if (cert.issuer?.trim()) itemScore += 30
    if (cert.date) itemScore += 30
    totalScore += Math.min(itemScore, 100)
  })

  const avgScore = Math.round(totalScore / certs.length)
  return { score: avgScore, tips, status: getStatus(avgScore) }
}

function analyzeProjects(projects, lang) {
  if (!projects || projects.length === 0) return { score: 0, tips: [], status: 'critical' }

  let totalScore = 0
  const tips = []

  projects.forEach((proj) => {
    let itemScore = 0
    if (proj.name?.trim()) itemScore += 30
    if (proj.description?.trim()) itemScore += 30
    if (proj.technologies?.length > 0) itemScore += 25
    if (proj.url?.trim()) itemScore += 15
    totalScore += Math.min(itemScore, 100)
  })

  const avgScore = Math.round(totalScore / projects.length)
  return { score: avgScore, tips, status: getStatus(avgScore) }
}

function calculateCompleteness(content) {
  const sections = ['personalInfo', 'summary', 'experience', 'education', 'skills', 'languages', 'certifications', 'projects']
  let filled = 0

  sections.forEach((sectionId) => {
    switch (sectionId) {
      case 'personalInfo':
        if (content.personalInfo?.fullName?.trim()) filled++
        break
      case 'summary':
        if (content.summary?.trim()) filled++
        break
      case 'experience':
        if (content.experience?.length > 0) filled++
        break
      case 'education':
        if (content.education?.length > 0) filled++
        break
      case 'skills':
        if (content.skills?.length > 0) filled++
        break
      case 'languages':
        if (content.languages?.length > 0) filled++
        break
      case 'certifications':
        if (content.certifications?.length > 0) filled++
        break
      case 'projects':
        if (content.projects?.length > 0) filled++
        break
    }
  })

  return Math.round((filled / sections.length) * 100)
}

function calculateATSCompatibility(content) {
  // Since we control the template, ATS compatibility is mostly about content
  let score = 100

  // Check for common ATS issues
  if (content.personalInfo?.photo) score -= 10 // Photos can cause ATS issues

  // Check if sections are in a reasonable order
  const order = content.sectionOrder || []
  if (order.indexOf('personalInfo') !== 0) score -= 5
  if (order.indexOf('summary') > 2) score -= 5

  return Math.max(score, 0)
}

function calculateKeywordStrength(content) {
  let keywords = 0
  let totalText = ''

  if (content.summary) totalText += ' ' + content.summary
  content.experience?.forEach((exp) => {
    totalText += ' ' + (exp.description || '')
  })
  content.skills?.forEach((skill) => {
    if (skill.name) totalText += ' ' + skill.name
  })

  const lowerText = totalText.toLowerCase()
  ACTION_VERBS.forEach((verb) => {
    if (lowerText.includes(verb.toLowerCase())) keywords++
  })

  if (keywords === 0) return 20
  if (keywords < 3) return 40
  if (keywords < 6) return 60
  if (keywords < 10) return 80
  return 100
}

function generateRecommendations(content, sections, lang) {
  const recs = []

  // Check each section
  Object.entries(sections).forEach(([sectionId, result]) => {
    if (result.status === 'critical') {
      const sectionName = sectionId === 'personalInfo' ? 'personal_info' : sectionId
      recs.push({
        type: 'critical',
        message: lang === 'ar'
          ? `قسم "${sectionName}" يحتاج إلى تعبئة عاجلة`
          : `Section "${sectionName}" needs to be filled urgently`,
      })
    }
  })

  // Specific recommendations
  if (content.experience?.length > 0) {
    const hasMetrics = content.experience.some((exp) =>
      /\d+%|\d+\s*(?:users|clients|projects|people|hours|years|months|revenue|sales)/i.test(exp.description || '')
    )
    if (!hasMetrics) {
      recs.push({
        type: 'improvement',
        message: lang === 'ar'
          ? 'أضف أرقاماً ونسباً في وصف خبراتك لتحسين التأثير'
          : 'Add numbers and metrics in your experience descriptions for better impact',
      })
    }
  }

  if (!content.personalInfo?.links?.linkedin) {
    recs.push({
      type: 'suggestion',
      message: lang === 'ar'
        ? 'أضف رابط LinkedIn لزيادة فرص التوظيف'
        : 'Add a LinkedIn URL to increase hiring chances',
    })
  }

  if (content.skills?.length < 5) {
    recs.push({
      type: 'suggestion',
      message: lang === 'ar'
        ? 'أضف المزيد من المهارات (يُفضّل 5 على الأقل)'
        : 'Add more skills (at least 5 recommended)',
    })
  }

  if (!content.languages?.length) {
    recs.push({
      type: 'suggestion',
      message: lang === 'ar'
        ? 'أضف اللغات التي تتقنها'
        : 'Add languages you speak',
    })
  }

  return recs
}

function getStatus(score) {
  if (score >= 85) return 'excellent'
  if (score >= 65) return 'good'
  if (score >= 40) return 'warning'
  return 'critical'
}

function getGrade(score) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

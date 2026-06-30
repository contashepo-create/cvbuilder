export const PLANS = {
  free: {
    id: 'free',
    name_ar: 'مجاني',
    name_en: 'Free',
    price: 0,
    currency: 'EGP',
    maxCVs: 1,
    features_ar: [
      'سي في واحد كحد أقصى',
      'جميع القوالب',
      'فحص ATS',
      'تصدير PDF',
    ],
    features_en: [
      'Up to 1 CV',
      'All templates',
      'ATS screening',
      'PDF export',
    ],
  },
  starter: {
    id: 'starter',
    name_ar: 'بداية',
    name_en: 'Starter',
    price: 100,
    currency: 'EGP',
    maxCVs: 3,
    features_ar: [
      '3 سي فيات كحد أقصى',
      'جميع القوالب',
      'فحص ATS',
      'تصدير PDF',
      'مساعد الذكاء الاصطناعي',
    ],
    features_en: [
      'Up to 3 CVs',
      'All templates',
      'ATS screening',
      'PDF export',
      'AI Assistant',
    ],
  },
  pro: {
    id: 'pro',
    name_ar: 'احترافي',
    name_en: 'Pro',
    price: 200,
    currency: 'EGP',
    maxCVs: 5,
    features_ar: [
      '5 سي فيات كحد أقصى',
      'جميع القوالب',
      'فحص ATS',
      'تصدير PDF',
      'مساعد الذكاء الاصطناعي',
      'قوالب حصرية',
      'دعم ذو أولوية',
    ],
    features_en: [
      'Up to 5 CVs',
      'All templates',
      'ATS screening',
      'PDF export',
      'AI Assistant',
      'Exclusive templates',
      'Priority support',
    ],
  },
}

export const FREE_PLAN_MAX_CVS = 1

export const PAYMENT_METHODS = [
  {
    id: 'orange_cash',
    name_ar: 'أورانج كاش',
    name_en: 'Orange Cash',
    number: '01000000000', // Replace with your actual Orange Cash number
    icon: '🟠',
  },
  {
    id: 'bank_transfer',
    name_ar: 'تحويل بنكي',
    name_en: 'Bank Transfer',
    number: 'ACC-123456789', // Replace with your actual bank account
    icon: '🏦',
    details_ar: 'بنك مصر - فرع الرئيسي',
    details_en: 'Banque Misr - Main Branch',
  },
  {
    id: 'instapay',
    name_ar: 'إنستا باي',
    name_en: 'InstaPay',
    number: 'instapay@your-handle', // Replace with your InstaPay handle
    icon: '⚡',
  },
]

export const TELEGRAM_CONTACT = 'https://t.me/your_telegram_username' // Replace with your Telegram

// Admin path is public (just a URL) — security comes from 3-layer auth
export const ADMIN_SECRET_PATH = import.meta.env.VITE_ADMIN_PATH || 'sys-mgmt-x9k2m7'
export const ADMIN_SECRET_KEY = import.meta.env.VITE_ADMIN_KEY || 'cv-admin-2026-secure'

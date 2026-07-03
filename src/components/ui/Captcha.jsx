import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Self-contained Captcha component
 * No external services required — works on any domain
 * Uses canvas to generate distorted text + background noise
 */

function generateCaptchaText() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let text = ''
  for (let i = 0; i < 5; i++) {
    text += chars[Math.floor(Math.random() * chars.length)]
  }
  return text
}

function drawCaptcha(canvas, text) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  // Background
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, w, h)

  // Noise lines
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 70%)`
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }

  // Noise dots
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 60%, 0.4)`
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Distorted text
  const colors = ['#2563eb', '#7c3aed', '#dc2626', '#059669', '#d97706']
  const fonts = ['bold 28px Cairo', 'bold 30px Inter', 'bold 26px sans-serif']

  for (let i = 0; i < text.length; i++) {
    ctx.save()
    const x = 25 + i * 32
    const y = h / 2 + (Math.random() - 0.5) * 10
    const angle = (Math.random() - 0.5) * 0.6
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.font = fonts[Math.floor(Math.random() * fonts.length)]
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.fillText(text[i], -10, 10)
    ctx.restore()
  }

  // More noise on top
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200}, 0.3)`
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let j = 0; j < w; j += 5) {
      ctx.lineTo(j, Math.random() * h)
    }
    ctx.stroke()
  }
}

export default function Captcha({ onVerify }) {
  const canvasRef = useRef(null)
  const [captchaText, setCaptchaText] = useState('')
  const [userInput, setUserInput] = useState('')
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')

  const generateNew = useCallback(() => {
    const text = generateCaptchaText()
    setCaptchaText(text)
    setUserInput('')
    setVerified(false)
    setError('')
    onVerify(null)
    setTimeout(() => drawCaptcha(canvasRef.current, text), 50)
  }, [onVerify])

  useEffect(() => {
    generateNew()
  }, [generateNew])

  const handleVerify = () => {
    if (userInput.toUpperCase().trim() === captchaText) {
      setVerified(true)
      setError('')
      onVerify(captchaText)
    } else {
      setError('❌ خطأ في الكود')
      generateNew()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleVerify()
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-sm text-green-700 font-medium">تم التحقق ✓</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Captcha canvas */}
        <canvas
          ref={canvasRef}
          width={180}
          height={56}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50"
        />

        {/* Refresh button */}
        <button
          type="button"
          onClick={generateNew}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="تحديث"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {/* Input + verify */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          className="input text-center font-mono tracking-widest text-lg"
          placeholder="•••••"
          maxLength={5}
          dir="ltr"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleVerify}
          className="btn-primary text-sm whitespace-nowrap"
        >
          تحقق
        </button>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { escapeHTML } from './validators'

/**
 * Export a CV element to PDF
 * @param {HTMLElement} element - The CV element to export
 * @param {string} filename - Output file name
 * @param {boolean} fitToOnePage - If true, scale content to fit one page
 */
export async function exportToPDF(element, filename = 'CV.pdf', fitToOnePage = false) {
  if (!element) {
    console.error('No element provided for PDF export')
    return
  }

  const safeFilename = escapeHTML(filename).replace(/[<>:"/\\|?*]/g, '_')

  // Wait for fonts to load
  try {
    await document.fonts.ready
  } catch {}

  // Clone the element to avoid modifying the visible one
  const clone = element.cloneNode(true)
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed; left:-9999px; top:0; width:794px; background:#fff;'
  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  // Force inline styles on the clone for html2canvas compatibility
  const ensureStyles = (el) => {
    // Replace gap with margins on children (html2canvas doesn't support gap)
    if (el.style?.gap) {
      const gap = el.style.gap
      const children = Array.from(el.children)
      children.forEach((child, i) => {
        if (i > 0) {
          child.style.marginInlineStart = gap
          child.style.marginBlockStart = gap
        }
      })
    }
    // Ensure flex works
    if (getComputedStyle(el).display === 'flex') {
      el.style.display = 'flex'
    }
    // Process children
    el.children && Array.from(el.children).forEach(ensureStyles)
  }
  ensureStyles(clone)

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      windowHeight: clone.scrollHeight,
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF('p', 'mm', 'a4')

    if (fitToOnePage && imgHeight > pageHeight) {
      const scaledWidth = (imgWidth * pageHeight) / imgHeight
      const xOffset = (imgWidth - scaledWidth) / 2
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, pageHeight)
    } else {
      // Multi-page: slice canvas across pages
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const pageHeightPx = (canvasWidth * pageHeight) / imgWidth
      let yPos = 0
      let pageNum = 0

      while (yPos < canvasHeight) {
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvasWidth
        sliceCanvas.height = Math.min(pageHeightPx, canvasHeight - yPos)
        const ctx = sliceCanvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx.drawImage(canvas, 0, yPos, canvasWidth, sliceCanvas.height, 0, 0, canvasWidth, sliceCanvas.height)

        const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92)
        if (pageNum > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, (sliceCanvas.height * imgWidth) / canvasWidth)

        yPos += pageHeightPx
        pageNum++
      }
    }

    pdf.save(safeFilename)
  } catch (error) {
    console.error('PDF export error:', error)
    throw error
  } finally {
    document.body.removeChild(wrapper)
  }
}

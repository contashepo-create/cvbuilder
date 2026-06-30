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

  // Sanitize filename to prevent XSS
  const safeFilename = escapeHTML(filename).replace(/[<>:"/\\|?*]/g, '_')

  // Store original styles
  const originalTransform = element.style.transform
  const originalWidth = element.style.width
  const originalMaxWidth = element.style.maxWidth

  // Expand for rendering
  element.style.transform = 'none'
  element.style.width = '800px'
  element.style.maxWidth = '800px'

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF('p', 'mm', 'a4')

    if (fitToOnePage && imgHeight > pageHeight) {
      // Scale to fit one page
      const scaledWidth = (imgWidth * pageHeight) / imgHeight
      const xOffset = (imgWidth - scaledWidth) / 2
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, pageHeight)
    } else {
      // Multi-page: slice canvas across pages
      let heightLeft = imgHeight
      let position = 0

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
    }

    pdf.save(safeFilename)
  } catch (error) {
    console.error('PDF export error:', error)
    throw error
  } finally {
    // Restore original styles
    element.style.transform = originalTransform
    element.style.width = originalWidth
    element.style.maxWidth = originalMaxWidth
  }
}

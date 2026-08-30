/**
 * PDF Generator for Ticket Receipts
 * Generates official 80mm thermal/A6 receipt format
 */

import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

interface TicketData {
  ticket_number: string
  unit_code: string
  resident_name: string
  problem: string
  description?: string | null
  priority?: string
  scheduled_at?: string | null
  created_at: string
  created_by_name?: string
}

interface GeneratePdfOptions {
  domain: string
}

export async function generateTicketPdf(
  ticket: TicketData,
  options: GeneratePdfOptions
): Promise<Buffer> {
  // Create A6 size document (105mm x 148mm) - close to thermal receipt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150], // 80mm width, variable height
  })

  const pageWidth = 80
  const margin = 8
  const contentWidth = pageWidth - (margin * 2)
  let y = margin

  // Helper function for centered text
  const centerText = (text: string, yPos: number, fontSize = 10) => {
    doc.setFontSize(fontSize)
    const textWidth = doc.getTextWidth(text)
    const x = (pageWidth - textWidth) / 2
    doc.text(text, x, yPos)
    return yPos
  }

  // Helper function for left-aligned text
  const leftText = (text: string, yPos: number, fontSize = 9) => {
    doc.setFontSize(fontSize)
    doc.text(text, margin, yPos)
    return yPos
  }

  // Helper for dotted line
  const addDottedLine = (yPos: number) => {
    doc.setDrawColor(180, 180, 180)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    doc.setLineDashPattern([], 0)
  }

  // Header - Gateway Apartment
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  centerText('GATEWAY APARTMENT', y)
  y += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  centerText('Resident Complaint System', y)
  y += 6

  addDottedLine(y)
  y += 4

  // Ticket Number
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  centerText(ticket.ticket_number, y)
  y += 6

  // Priority badge if URGENT
  if (ticket.priority === 'URGENT') {
    doc.setFillColor(255, 230, 230)
    doc.roundedRect(margin + 15, y - 3, contentWidth - 30, 5, 1, 1, 'F')
    doc.setTextColor(200, 50, 50)
    doc.setFontSize(7)
    centerText('⚠ URGENT - MULTI-DAY', y)
    doc.setTextColor(0, 0, 0)
    y += 5
  }

  addDottedLine(y)
  y += 4

  // Date
  const createdDate = new Date(ticket.created_at)
  const formattedDate = createdDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = createdDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  leftText(`Tanggal: ${formattedDate}`, y)
  y += 4
  leftText(`Waktu: ${formattedTime} WIB`, y)
  y += 6

  addDottedLine(y)
  y += 4

  // Unit & Resident Info
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  leftText('INFORMASI UNIT', y)
  y += 4

  doc.setFont('helvetica', 'normal')
  leftText(`Unit: ${ticket.unit_code}`, y)
  y += 4
  leftText(`Warga: ${ticket.resident_name}`, y)
  y += 6

  // Complaint
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  leftText('KELUHAN', y)
  y += 4

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  const problemLines = doc.splitTextToSize(ticket.problem, contentWidth)
  problemLines.forEach((line: string) => {
    leftText(line, y)
    y += 4
  })
  y += 2

  // Description if exists
  if (ticket.description) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    leftText('DETAIL:', y)
    y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const descLines = doc.splitTextToSize(ticket.description, contentWidth)
    descLines.forEach((line: string) => {
      leftText(line, y)
      y += 3
    })
    y += 2
  }

  // Scheduled Date if exists
  if (ticket.scheduled_at) {
    const scheduledDate = new Date(ticket.scheduled_at)
    const scheduledFormatted = scheduledDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })

    doc.setFillColor(255, 248, 220)
    doc.roundedRect(margin, y - 2, contentWidth, 8, 1, 1, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(180, 140, 0)
    leftText(`📅 JADWAL: ${scheduledFormatted} WIB`, y + 1)
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  // Created By
  if (ticket.created_by_name) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    leftText(`Dibuat oleh: ${ticket.created_by_name}`, y)
    doc.setTextColor(0, 0, 0)
    y += 4
  }

  y += 4
  addDottedLine(y)
  y += 6

  // QR Code Section
  const trackingUrl = `${options.domain}/public/ticket?number=${encodeURIComponent(ticket.ticket_number)}`

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
    width: 60,
    margin: 0,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  })

  // Add QR code centered
  const qrSize = 30
  const qrX = (pageWidth - qrSize) / 2
  doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize)
  y += qrSize + 3

  // QR caption
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  centerText('Scan QR untuk pantau progress', y)
  y += 3
  centerText('dari HP Anda', y)
  y += 6

  addDottedLine(y)
  y += 4

  // Footer
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  centerText('RCMS - Resident Complaint Management', y)
  y += 3
  doc.setFontSize(5)
  centerText(`Dicetak: ${new Date().toLocaleString('id-ID')}`, y)

  // Return as Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}

/**
 * Generate PDF and return as base64 for direct embedding
 */
export async function generateTicketPdfBase64(
  ticket: TicketData,
  options: GeneratePdfOptions
): Promise<string> {
  const buffer = await generateTicketPdf(ticket, options)
  return buffer.toString('base64')
}

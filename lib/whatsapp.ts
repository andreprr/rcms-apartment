/**
 * WhatsApp helpers.
 * WhatsApp delivery uses a direct wa.me deeplink (no third-party gateway API).
 */

/**
 * Format phone number to international format
 * Examples:
 *   081234567890 -> 6281234567890
 *   +6281234567890 -> 6281234567890
 *   6281234567890 -> 6281234567890
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // If starts with '0', replace with '62'
  if (digits.startsWith('0')) {
    return '62' + digits.substring(1)
  }

  // If starts with '62', keep as is
  if (digits.startsWith('62')) {
    return digits
  }

  // If starts with '8' (no country code), add '62'
  if (digits.startsWith('8')) {
    return '62' + digits
  }

  // Return as is if already formatted
  return digits
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  // Should be between 10-15 digits (including country code)
  return /^\d{10,15}$/.test(formatted)
}

/**
 * Build a direct WhatsApp deeplink (wa.me) URL to share a ticket receipt.
 * This avoids any third-party WhatsApp Gateway API — it simply opens the
 * native WhatsApp Web/app with a pre-filled message.
 */
export function getWhatsAppShareUrl(
  phone: string,
  ticketNumber: string,
  residentName: string,
  problem: string
): string {
  // Format phone to international 62 prefix
  const formattedPhone = formatPhoneNumber(phone)

  const text =
    `Halo Bpk/Ibu ${residentName},%0A%0A` +
    `Pengaduan Anda telah kami catat dengan rincian berikut:%0A` +
    `• *No. Tiket*: ${ticketNumber}%0A` +
    `• *Keluhan*: ${problem}%0A%0A` +
    `Anda dapat memantau status perbaikan secara real-time melalui tautan berikut:%0A` +
    `${typeof window !== 'undefined' ? window.location.origin : ''}/public/ticket?number=${encodeURIComponent(ticketNumber)}%0A%0A` +
    `Terima kasih,%0AManagement Gateway Apartment`

  return `https://wa.me/${formattedPhone}?text=${text}`
}

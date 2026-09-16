/** Display an adviser-supplied website without permitting executable links or credentials. */
export function practiceWebsite(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null
  const text = value.trim()
  if (text.startsWith('/') || text.includes('\\')) return null
  if (/\s/.test(text)) return null
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(candidate)
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes('.')
    )
      return null
    return url.href
  } catch {
    return null
  }
}

export function practiceEmail(value: string | null | undefined): string | null {
  const email = value?.trim()
  return email && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : null
}

export function practicePhone(value: string | null | undefined): string | null {
  if (!value || !/^[+()\-\s\d]{7,24}$/.test(value)) return null
  const phone = value.replace(/[()\-\s]/g, '')
  // The imported/test profiles can contain Ofcom's fictional mobile range.
  // https://www.ofcom.org.uk/phones-and-broadband/phone-numbers/numbers-for-drama
  const ukPhone = phone.replace(/^(?:\+44|0044)0?/, '0')
  if (/^07700900\d{3}$/.test(ukPhone)) return null
  return phone
}

export function clientReplyEmail(adviser: {
  email: string
  contact_email?: string | null
}): string {
  return practiceEmail(adviser.contact_email) ?? adviser.email
}

export interface PracticeDetails {
  job_title?: string | null
  website?: string | null
  business_location?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  services?: string | null
  client_focus?: string | null
}

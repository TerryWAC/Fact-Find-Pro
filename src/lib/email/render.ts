import { BRAND } from '@/lib/constants'
import { brandTheme } from '@/lib/branding'
import { emailAddress } from './config'

/** Client-supplied variables never become HTML. */
export function interpolate(template: string, variables: Record<string, string | undefined>, html = false): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key]
    const text = value === undefined || value === null || value === '' ? '—' : String(value)
    return html ? escapeHtml(text) : text
  })
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export interface EmailBranding {
  companyName?: string | null
  colour?: string | null
  logoUrl?: string | null
  adviserName?: string | null
  replyTo?: string | null
}

function imageUrl(value?: string | null): string | null {
  try {
    const url = new URL(value ?? '')
    return url.protocol === 'https:' && !url.username && !url.password ? escapeHtml(url.href) : null
  } catch { return null }
}

/** Style saved templates and defaults, preserving admin-authored inline styles. */
function styleBody(html: string, colour: string, onColour: string): string {
  const styles: Record<string, string> = {
    h2: 'margin:0 0 24px;font-size:30px;line-height:1.2;letter-spacing:-1px;font-weight:700;color:#171b20;',
    p: 'margin:0 0 20px;font-size:15px;line-height:1.75;',
    ul: 'list-style:none;margin:24px 0;padding:20px 24px;background-color:#f5f6f7;border:1px solid #e6e8eb;border-radius:12px;',
    li: 'margin:0;padding:5px 0;font-size:14px;line-height:1.6;',
    a: `color:${colour};text-decoration:underline;overflow-wrap:anywhere;`,
  }
  // Single-link paragraphs in the built-ins become Outlook-safe buttons.
  const buttons = html.replace(/<p>\s*<a href="([^"]+)">([^<]+)<\/a>\s*<\/p>/gi,
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr><td bgcolor="${colour}" style="border-radius:8px;text-align:center;mso-padding-alt:16px 24px;"><a href="$1" style="display:inline-block;padding:16px 24px;border:1px solid ${colour};border-radius:8px;color:${onColour};font-size:15px;font-weight:700;text-decoration:none;line-height:20px;mso-padding-alt:0;">$2 &nbsp; &#8594;</a></td></tr></table>`)
  return buttons.replace(/<(h2|p|ul|li|a)(\s[^>]*?)?>/gi, (tag, name: string, attributes = '') =>
    /\bstyle\s*=/i.test(attributes) ? tag : `<${name}${attributes} style="${styles[name.toLowerCase()]}">`)
}

/** Table layout, inline styles and text identity survive blocked mail images. */
export function wrapHtml(innerHtml: string, previewText?: string, branding?: EmailBranding): string {
  const theme = brandTheme(branding?.colour)
  const title = branding ? branding.companyName?.trim() || branding.adviserName?.trim() || 'Your adviser' : BRAND.product
  const contact = emailAddress(branding ? branding.replyTo ?? '' : BRAND.supportEmail)
  const logo = imageUrl(branding?.logoUrl)
  const safeTitle = escapeHtml(title)
  const styledBody = styleBody(innerHtml, theme.strong, brandTheme(theme.strong).onColour)
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${safeTitle}</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}img{border:0;outline:none;text-decoration:none}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}@media(max-width:620px){.email-outer{padding:20px 12px!important}.email-pad{padding-left:24px!important;padding-right:24px!important}.email-body h2{font-size:26px!important}.email-logo{max-width:180px!important}}</style>
</head><body style="margin:0;padding:0;background-color:#eef0f3;font-family:Arial,Helvetica,sans-serif;color:#414851;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(previewText ?? '')}&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eef0f3"><tr><td class="email-outer" align="center" style="padding:40px 16px;">
<!--[if mso]><table role="presentation" width="600"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e5e9;">
<tr><td class="email-pad" style="padding:32px 40px;background-color:${theme.colour};color:${theme.onColour};">
${logo ? `<img class="email-logo" src="${logo}" alt="${safeTitle}" width="200" style="display:block;width:auto;max-width:200px;max-height:64px;height:auto;margin-bottom:16px;">` : ''}
<p style="margin:0;font-size:20px;line-height:1.4;font-weight:700;letter-spacing:-0.4px;color:${theme.onColour};overflow-wrap:anywhere;">${safeTitle}</p>
<p style="margin:8px 0 0;font-size:10px;line-height:1.5;letter-spacing:2px;text-transform:uppercase;color:${theme.onColour};">${branding ? 'Your personal advice team' : 'Your adviser workspace'}</p>
</td></tr><tr><td height="4" bgcolor="${theme.accent}" style="font-size:0;line-height:4px;">&nbsp;</td></tr>
<tr><td class="email-pad email-body" style="padding:36px 40px 20px;font-size:15px;line-height:1.75;overflow-wrap:anywhere;word-break:break-word;">${styledBody}</td></tr>
<tr><td class="email-pad" style="padding:24px 40px 30px;border-top:1px solid #e6e8eb;background-color:#fafbfc;">
<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#252b32;">${branding?.adviserName ? escapeHtml(branding.adviserName) : safeTitle}</p>
<p style="margin:0;font-size:12px;line-height:1.8;color:#606873;">${branding ? safeTitle : escapeHtml(BRAND.organisation)}${contact ? `<br><a href="mailto:${escapeHtml(contact)}" style="color:${theme.strong};text-decoration:underline;overflow-wrap:anywhere;">${escapeHtml(contact)}</a>` : ''}</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
<p style="max-width:520px;margin:22px auto 0;font-size:11px;line-height:1.7;color:#626b76;">${branding ? 'Private correspondence from ' + safeTitle + '.<br>Please keep any attached documents somewhere safe.' : 'An account update from ' + escapeHtml(BRAND.product) + '.'}</p>
</td></tr></table></body></html>`
}

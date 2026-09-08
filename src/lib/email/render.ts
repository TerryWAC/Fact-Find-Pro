import { BRAND } from '@/lib/constants'

/** Replaces every {{token}} in `template` with the matching variable. */
export function interpolate(template: string, variables: Record<string, string | undefined>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key]
    return value === undefined || value === null || value === '' ? '—' : String(value)
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Wraps rendered template HTML in the Wealthy Advisers Club shell. */
export function wrapHtml(innerHtml: string, previewText?: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(BRAND.product)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141414;">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ee;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(10,10,10,0.12);">
        <tr>
          <td style="background:linear-gradient(140deg,#0A0A0A 0%,#1F1F1F 100%);padding:28px 32px;">
            <div style="font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">${escapeHtml(BRAND.product)}</div>
            <div style="font-size:12px;color:#E5B45C;text-transform:uppercase;letter-spacing:1.4px;margin-top:6px;">${escapeHtml(BRAND.organisation)}</div>
          </td>
        </tr>
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#C08F2E 0%,#E5B45C 50%,#F0D49A 100%);"></td>
        </tr>
        <tr>
          <td style="padding:32px;font-size:15px;line-height:1.65;color:#26221c;">
            ${innerHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #e8e4dd;font-size:12px;color:#7a736a;">
            ${escapeHtml(BRAND.organisation)} · ${escapeHtml(BRAND.product)}<br />
            Questions? Email <a href="mailto:${escapeHtml(BRAND.supportEmail)}" style="color:#8a6417;">${escapeHtml(BRAND.supportEmail)}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

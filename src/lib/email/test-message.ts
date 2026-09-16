import { createElement } from 'react'
import { wrapHtml } from './render'
import type { OutgoingEmail } from './transport'

/** A synthetic attachment: no database lookups, client records or remote images. */
export async function createTestEmail(to: string): Promise<OutgoingEmail> {
  const { Document, Page, Text, View, renderToBuffer } = await import('@react-pdf/renderer')
  const document = createElement(
    Document,
    { title: 'FactFind Pro email test', author: 'FactFind Pro' },
    createElement(
      Page,
      {
        size: 'A4',
        style: { padding: 48, fontFamily: 'Helvetica', fontSize: 11, color: '#141414' },
      },
      createElement(
        View,
        { style: { padding: 24, backgroundColor: '#0A0A0A', marginBottom: 28 } },
        createElement(Text, { style: { color: '#E5B45C', fontSize: 24 } }, 'FactFind Pro'),
        createElement(
          Text,
          { style: { color: '#FFFFFF', marginTop: 10 } },
          'Email and PDF attachment test',
        ),
      ),
      createElement(
        Text,
        { style: { fontSize: 18, marginBottom: 18 } },
        'Your PDF attachment is working.',
      ),
      createElement(
        Text,
        { style: { lineHeight: 1.6 } },
        'This is a test document with fictional information. It does not contain any client records and does not represent a completed FactFind.',
      ),
      createElement(
        Text,
        { style: { marginTop: 28, color: '#777777' } },
        'Test reference: FF-EMAIL-TEST',
      ),
    ),
  )
  const content = Buffer.from(await renderToBuffer(document))
  const subject = 'FactFind Pro - email and PDF test'
  return {
    to: [to],
    subject,
    text: 'Your FactFind Pro email connection is working. A sample PDF is attached. This test contains no client data. If you can read this message and open the PDF, both parts reached your inbox.',
    html: wrapHtml(
      '<h2>Your email connection is working</h2><p>This is a test from FactFind Pro. A sample PDF is attached so you can check that attachments open correctly.</p><p><strong>No client information is included.</strong></p><p>If you can read this message and open the PDF, both parts reached your inbox.</p>',
      subject,
    ),
    attachments: [{ filename: 'factfind-email-test.pdf', content }],
  }
}

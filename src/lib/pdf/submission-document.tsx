/* eslint-disable jsx-a11y/alt-text -- react-pdf Image primitives are not HTML images and take no alt */
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { Fragment } from 'react'
import { FACTFIND_TYPE_META, SUBMISSION_STATUS_META } from '@/lib/constants'
import { brandTheme } from '@/lib/branding'
import type { AnswerRow, StepBlock } from '@/lib/submission-data'
import type { FactFindSubmission } from '@/lib/supabase/database.types'
import type { PdfImage } from './images'

export interface PdfAdviser {
  name: string
  company_name: string | null
  email: string
  phone?: string | null
  brand_colour: string | null
}

export interface SubmissionPdfProps {
  submission: FactFindSubmission
  adviser: PdfAdviser
  steps: StepBlock[]
  logo: PdfImage | null
  photo: PdfImage | null
  fontFamily: string
  generatedAt: Date
}

const INK = '#0A0A0A'
const MUTED = '#6B6259'
const RULE = '#E8E2D8'

function makeStyles(fontFamily: string, colour: string, onColour: string, accent: string, strong: string) {
  return StyleSheet.create({
    page: { fontFamily, fontSize: 9.5, color: INK, paddingTop: 0, paddingBottom: 56, paddingHorizontal: 0, backgroundColor: '#FFFFFF' },
    band: { backgroundColor: colour, color: onColour, paddingVertical: 20, paddingHorizontal: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bandRule: { height: 4, backgroundColor: accent, marginBottom: 18 },
    logo: { maxHeight: 44, maxWidth: 200, objectFit: 'contain' },
    lockup: { flexDirection: 'column', maxWidth: 230 },
    lockupProduct: { fontSize: 15, fontWeight: 700, color: onColour },
    lockupOrg: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: accent, marginTop: 3 },
    bandRight: { alignItems: 'flex-end' },
    formTitle: { fontSize: 13, fontWeight: 600, color: onColour },
    reference: { fontSize: 9, color: onColour, opacity: 0.85, marginTop: 3 },
    body: { paddingHorizontal: 40, paddingTop: 4 },
    intro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    h1: { fontSize: 18, fontWeight: 700, color: INK },
    sub: { fontSize: 9.5, color: MUTED, marginTop: 3 },
    adviserCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: RULE, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, width: 230, flexShrink: 0 },
    adviserText: { flex: 1, minWidth: 0 },
    photo: { width: 34, height: 34, borderRadius: 17, objectFit: 'cover', marginRight: 9 },
    eyebrow: { fontSize: 6.5, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: MUTED },
    adviserName: { fontSize: 9.5, fontWeight: 600, marginTop: 1 },
    adviserMeta: { fontSize: 8, color: MUTED },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: RULE, borderRadius: 6, padding: 10, marginBottom: 18 },
    detail: { width: '33.33%', paddingVertical: 4, paddingRight: 8 },
    detailValue: { fontSize: 9.5, marginTop: 1 },
    section: { marginBottom: 14 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: RULE },
    sectionBar: { width: 4, height: 12, backgroundColor: colour, borderRadius: 2, marginRight: 7 },
    sectionTitle: { fontSize: 11, fontWeight: 600, color: strong },
    rows: { flexDirection: 'row', flexWrap: 'wrap' },
    row: { width: '50%', paddingVertical: 4, paddingRight: 12 },
    rowWide: { width: '100%', paddingVertical: 4, paddingRight: 12 },
    label: { fontSize: 7, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED },
    value: { fontSize: 9.5, marginTop: 1.5 },
    empty: { fontSize: 9, color: MUTED, fontStyle: 'italic' },
    footer: { position: 'absolute', left: 40, right: 40, bottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: RULE, paddingTop: 8 },
    footerText: { fontSize: 7, color: MUTED, maxWidth: 420 },
  })
}

function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Email addresses have no spaces; explicit breaks preserve every character without adding hyphens. */
function wrapEmail(email: string, limit: number): string {
  return email.match(new RegExp(`.{1,${limit}}`, 'gu'))?.join('\n') ?? email
}

function needsFullRow(answer: AnswerRow): boolean {
  return answer.label.length > 90 || answer.display.length > 70 || /\S{25}/u.test(answer.display)
}

/** A branded, printable record of one FactFind submission. */
export function SubmissionPdf({ submission, adviser, steps, logo, photo, fontFamily, generatedAt }: SubmissionPdfProps) {
  const theme = brandTheme(adviser.brand_colour)
  const s = makeStyles(fontFamily, theme.colour, theme.onColour, theme.accent, theme.strong)
  const meta = FACTFIND_TYPE_META[submission.form_type]
  const firm = adviser.company_name || adviser.name
  const title = `${meta.label} — ${submission.client_name}`

  return (
    <Document title={title} author={firm} subject={`${meta.label} ${submission.reference}`} creator={firm} producer={firm}>
      <Page size="A4" style={s.page}>
        {/* Brand band */}
        <View style={s.band} fixed>
          {logo ? (
            <Image src={logo} style={s.logo} />
          ) : (
            <View style={s.lockup}>
              <Text style={s.lockupProduct}>{firm}</Text>
              <Text style={s.lockupOrg}>Your personal advice team</Text>
            </View>
          )}
          <View style={s.bandRight}>
            <Text style={s.formTitle}>{meta.label}</Text>
            <Text style={s.reference}>Reference {submission.reference}</Text>
          </View>
        </View>
        <View style={s.bandRule} fixed />

        <View style={s.body}>
          <View style={s.intro}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
              <Text style={s.h1}>{submission.client_name}</Text>
              <Text style={s.sub}>{meta.description}</Text>
            </View>
            <View style={s.adviserCard}>
              {photo && <Image src={photo} style={s.photo} />}
              <View style={s.adviserText}>
                <Text style={s.eyebrow}>Your adviser</Text>
                <Text style={s.adviserName}>{adviser.name}</Text>
                {adviser.company_name && <Text style={s.adviserMeta}>{adviser.company_name}</Text>}
                <Text style={s.adviserMeta}>{wrapEmail(adviser.email, photo ? 24 : 30)}</Text>
              </View>
            </View>
          </View>

          <View style={s.detailsGrid}>
            {[
              ['Client', submission.client_name],
              ['Email', submission.client_email],
              ['Phone', submission.client_phone || '—'],
              ['Submitted', formatDateTime(submission.submitted_at)],
              ['Reference', submission.reference],
              ['Status', SUBMISSION_STATUS_META[submission.status]?.label ?? submission.status],
            ].map(([label, value]) => (
              <View key={label} style={s.detail}>
                <Text style={s.eyebrow}>{label}</Text>
                <Text style={s.detailValue}>{label === 'Email' ? wrapEmail(value, 28) : value}</Text>
              </View>
            ))}
          </View>

          {steps.length === 0 && <Text style={s.empty}>This submission did not include any answer data.</Text>}

          {steps.map((step) => {
            const firstRowSize = step.answers.length > 1 && !needsFullRow(step.answers[0]) && !needsFullRow(step.answers[1]) ? 2 : 1
            const firstRow = step.answers.slice(0, firstRowSize)
            const answerRow = (answer: AnswerRow, index: number) => (
              <View key={`${step.id}-${index}`} style={needsFullRow(answer) ? s.rowWide : s.row} wrap={answer.display.length > 400}>
                <Text style={s.label}>{answer.label}</Text>
                <Text style={s.value}>{answer.display.replace(/\S{49,}/gu, (word) => wrapEmail(word, 48))}</Text>
              </View>
            )
            return (
            <Fragment key={step.id}>
              {/* Keep a heading with its first complete row. Very long answers remain splittable. */}
              <View wrap={firstRow.some((answer) => answer.display.length > 400)}>
              <View style={s.sectionHead} minPresenceAhead={40}>
                <View style={s.sectionBar} />
                <Text style={s.sectionTitle}>{step.title}</Text>
              </View>
              <View style={s.rows}>
                {firstRow.length === 0 ? (
                  <Text style={s.empty}>No answers in this section.</Text>
                ) : (
                  firstRow.map(answerRow)
                )}
              </View>
              </View>
              <View style={[s.rows, s.section]}>
                {step.answers.slice(firstRowSize).map((answer, index) => answerRow(answer, index + firstRowSize))}
              </View>
            </Fragment>
            )
          })}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {firm} · Generated {formatDateTime(generatedAt)} · Confidential
          </Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

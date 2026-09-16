import { test, expect } from '@playwright/test'
import { displayValue } from '../../src/lib/forms/engine'
import { normaliseSubmissionData } from '../../src/lib/submission-data'

test('review and exports retain pounds and pence without adding decimals to whole amounts', () => {
  for (const [value, expected] of [['0', '£0'], ['1234', '£1,234'], ['1234.56', '£1,234.56'], ['12.5', '£12.50'], ['-12.5', '-£12.50']]) {
    expect(displayValue({ id: 'amount', type: 'currency' }, value)).toBe(expected)
  }
})

test('Yes, No and unanswered remain distinct in the review and saved presentation', () => {
  for (const [value, expected] of [['yes', 'Yes'], ['no', 'No'], ['', '—']]) {
    expect(displayValue({ id: 'answer', type: 'yesno' }, value)).toBe(expected)
  }
})

test('existing typed submissions show original pence and readable Yes/No without rewriting the data', () => {
  const data = { steps: [{ id: 'details', title: 'Details', answers: [
    { id: 'amount', type: 'currency', value: '1234.56', display: '£1,235' },
    { id: 'answer', type: 'yesno', value: 'no', display: 'no' },
    { id: 'blank', type: 'yesno', value: '', display: '—' },
    { id: 'custom', value: 'raw', display: 'Saved custom wording' },
  ] }] }
  const before = JSON.stringify(data)
  expect(normaliseSubmissionData(data)[0].answers.map((answer) => answer.display)).toEqual([
    '£1,234.56', 'No', '—', 'Saved custom wording',
  ])
  expect(JSON.stringify(data)).toBe(before)
})

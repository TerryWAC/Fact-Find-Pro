import { test, expect } from '@playwright/test'
import { csvCell, directoryCsv, followUpNotes, importStatus, stringFields } from '../../src/lib/adviser-directory'

test('CSV preserves quoted names, newlines and phone numbers while neutralising formulas', () => {
  expect(csvCell('O"Brien, Jo')).toBe('"O""Brien, Jo"')
  for (const value of ['=HYPERLINK("bad")', '+447700900123', '-1+1', '@SUM(A1)', '  =1+1', '\tformula']) expect(csvCell(value)).toBe(`"'${value.replaceAll('"', '""')}"`)
  expect(directoryCsv([['Name', 'Email'], ['Zoë\nRivers', 'zoe@example.test']])).toContain('"Zoë\nRivers"')
})

test('an included record is not described as prepared until its account exists', () => {
  expect(importStatus({ decision: 'include', profile_id: null })).toBe('Preparation incomplete')
  expect(importStatus({ decision: 'include', profile_id: 'some-id' })).toBe('Prepared adviser')
  expect(importStatus({ decision: 'hold', profile_id: null })).toBe('Needs identity review')
})

test('untrusted JSON cannot become object-valued attributes or rendered child objects', () => {
  expect(stringFields({ phone: '+447700900123', nested: { src: 'bad' }, missing: null })).toEqual({ phone: '+447700900123' })
  expect(stringFields(['unexpected'])).toEqual({})
  expect(followUpNotes(['A note', { toString: 'bad' }, false])).toEqual(['A note'])
})

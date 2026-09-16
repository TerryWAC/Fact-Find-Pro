import { test, expect } from '@playwright/test'
import {
  practiceWebsite,
  practiceEmail,
  practicePhone,
  clientReplyEmail,
} from '../../src/lib/practice'
import {
  onboardingDetailsSchema,
  completeProfileSchema,
} from '../../src/lib/validations'

test('business websites accept bare domains while rejecting executable and credential-bearing links', () => {
  expect(practiceWebsite('example.co.uk/contact')).toBe(
    'https://example.co.uk/contact',
  )
  expect(practiceWebsite('https://example.co.uk')).toBe(
    'https://example.co.uk/',
  )
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,test',
    '//evil.test',
    'https://name:secret@example.test',
    'not a website',
    '/settings',
    '',
  ])
    expect(practiceWebsite(value)).toBeNull()
})

test('contact links and client PDF reply-to cannot inject a mail header or phone instruction', () => {
  expect(practiceEmail(' hello@example.test ')).toBe('hello@example.test')
  expect(
    practiceEmail('hello@example.test\r\nBcc: other@example.test'),
  ).toBeNull()
  expect(practicePhone('+1 (202) 555-0123')).toBe('+12025550123')
  for (const phone of ['07700 900123', '+44 (7700) 900001', '00447700900999'])
    expect(practicePhone(phone)).toBeNull()
  expect(practicePhone('07700900123;123')).toBeNull()
  expect(
    clientReplyEmail({
      email: 'account@example.test',
      contact_email: 'clients@example.test',
    }),
  ).toBe('clients@example.test')
  expect(
    clientReplyEmail({ email: 'account@example.test', contact_email: '' }),
  ).toBe('account@example.test')
  expect(
    clientReplyEmail({
      email: 'account@example.test',
      contact_email: 'malformed',
    }),
  ).toBe('account@example.test')
})

test('both practice-save paths share URL normalization, optional descriptions and field limits', () => {
  const values = {
    name: 'Alex Morgan',
    company_name: 'Morgan Financial',
    phone: '07700 900123',
    website: 'example.co.uk',
    contact_email: 'clients@example.test',
    services: 'Mortgages and protection',
    client_focus: 'First-time buyers',
  }
  for (const schema of [onboardingDetailsSchema, completeProfileSchema]) {
    const parsed = schema.parse(values)
    expect(parsed.website).toBe('https://example.co.uk/')
    expect(parsed.client_focus).toBe('First-time buyers')
    expect(
      schema.safeParse({ ...values, services: 'x'.repeat(601) }).success,
    ).toBe(false)
    expect(
      schema.safeParse({ ...values, website: 'javascript:alert(1)' }).success,
    ).toBe(false)
    expect(
      schema.safeParse({
        ...values,
        website: '',
        contact_email: '',
        client_focus: '',
      }).success,
    ).toBe(true)
  }
})

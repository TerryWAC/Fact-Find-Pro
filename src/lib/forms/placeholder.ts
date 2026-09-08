import type { FactFindType } from '@/lib/supabase/database.types'
import type { FormSchema, FormStep } from './types'

/**
 * Placeholder schema factory.
 *
 * Every FactFind currently ships with the same neutral, question-free
 * structure: an identity step, three placeholder sections and declarations.
 * Replace the returned `steps` with a real question set to go live — the
 * renderer, validation, progress bar and submission pipeline stay unchanged.
 */

/** Reserved step. The three identity fields bind a submission to a client. */
export const identityStep: FormStep = {
  id: 'about-you',
  title: 'About you',
  description: 'So your adviser knows who this FactFind belongs to.',
  fields: [
    {
      id: 'client_name',
      type: 'text',
      label: 'Full name',
      placeholder: 'e.g. Alex Morgan',
      required: true,
      colSpan: 2,
      identity: 'client_name',
    },
    {
      id: 'client_email',
      type: 'email',
      label: 'Email address',
      placeholder: 'you@example.co.uk',
      required: true,
      colSpan: 1,
      identity: 'client_email',
    },
    {
      id: 'client_phone',
      type: 'tel',
      label: 'Phone number',
      placeholder: '07700 900000',
      helpText: 'Optional, but it helps your adviser reach you.',
      colSpan: 1,
      identity: 'client_phone',
    },
  ],
}

export const declarationsStep: FormStep = {
  id: 'declarations',
  title: 'Declarations',
  description: 'Confirm the below and submit your FactFind to your adviser.',
  fields: [
    {
      id: 'declaration_intro',
      type: 'paragraph',
      label:
        'The information you provide is shared only with your adviser and is used to assess your needs and recommend suitable products.',
    },
    {
      id: 'consent_accuracy',
      type: 'checkbox',
      label: 'The information I have provided is accurate to the best of my knowledge.',
      required: true,
    },
    {
      id: 'consent_contact',
      type: 'checkbox',
      label: 'I am happy for my adviser to contact me about this enquiry.',
      required: true,
    },
    {
      id: 'consent_marketing',
      type: 'checkbox',
      label: 'I would like to receive occasional updates and guidance by email. (Optional)',
    },
    {
      id: 'additional_notes',
      type: 'textarea',
      label: 'Anything else your adviser should know?',
      placeholder: 'Optional — add any context you think is relevant.',
      rows: 4,
    },
  ],
}

function placeholderSection(
  id: string,
  title: string,
  description: string,
  note: string,
): FormStep {
  return {
    id,
    title,
    description,
    fields: [
      {
        id: `${id}__notice`,
        type: 'paragraph',
        label: note,
      },
      {
        id: `${id}__response`,
        type: 'textarea',
        label: 'Placeholder response',
        placeholder: 'This section will be replaced by the real question set.',
        helpText: 'Temporary field so the section captures data end to end.',
        rows: 4,
      },
      { id: `${id}__divider`, type: 'divider' },
    ],
  }
}

const SECTION_COPY: Record<FactFindType, { title: string; subtitle: string; sections: Array<[string, string, string]> }> = {
  mortgage: {
    title: 'Mortgage FactFind',
    subtitle: 'A short set of questions so your adviser can find the right mortgage for you.',
    sections: [
      ['your-situation', 'Your situation', 'Your household, employment and income.'],
      ['your-property', 'Your property', 'The property you are buying or remortgaging.'],
      ['your-requirements', 'Your requirements', 'What you need the mortgage to do.'],
    ],
  },
  protection: {
    title: 'Protection FactFind',
    subtitle: 'Help your adviser understand what you and your family need to protect.',
    sections: [
      ['your-household', 'Your household', 'Who depends on your income.'],
      ['your-commitments', 'Your commitments', 'Your outgoings and existing cover.'],
      ['your-priorities', 'Your priorities', 'What matters most to protect.'],
    ],
  },
  medical: {
    title: 'Medical FactFind',
    subtitle: 'Health and lifestyle information used to assess your cover.',
    sections: [
      ['your-health', 'Your health', 'General health and medical history.'],
      ['your-lifestyle', 'Your lifestyle', 'Lifestyle factors relevant to underwriting.'],
      ['your-cover', 'Your cover', 'Existing policies and disclosures.'],
    ],
  },
  home: {
    title: 'Home FactFind',
    subtitle: 'Details about your home so your adviser can arrange the right cover.',
    sections: [
      ['your-home', 'Your home', 'The property to be insured.'],
      ['your-contents', 'Your contents', 'What you need covered inside the home.'],
      ['your-cover', 'Your cover', 'Existing policies and claims history.'],
    ],
  },
}

const PLACEHOLDER_NOTE =
  'This section is a placeholder. The full question set is being finalised by the Wealthy Advisers Club team and will appear here shortly.'

/** Builds the shipped placeholder schema for a FactFind type. */
export function createPlaceholderSchema(type: FactFindType): FormSchema {
  const copy = SECTION_COPY[type]

  return {
    type,
    version: '0.1.0-placeholder',
    title: copy.title,
    subtitle: copy.subtitle,
    intro:
      'It takes around five minutes. Your answers are saved when you submit and are sent straight to your adviser.',
    estimatedMinutes: 5,
    placeholder: true,
    submitLabel: 'Submit FactFind',
    successTitle: 'Thank you — your FactFind has been submitted',
    successMessage:
      'Your adviser has received your details and will be in touch shortly. You can safely close this page.',
    steps: [
      identityStep,
      ...copy.sections.map(([id, title, description]) =>
        placeholderSection(id, title, description, PLACEHOLDER_NOTE),
      ),
      declarationsStep,
    ],
  }
}

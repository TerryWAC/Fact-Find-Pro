'use client'

import { Controller, type Control, type UseFormRegister } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldError } from '@/components/shared/field-error'
import type { FormField, FormValues } from '@/lib/forms/types'
import { cn } from '@/lib/utils'

interface FieldRendererProps {
  field: FormField
  control: Control<FormValues>
  register: UseFormRegister<FormValues>
  error?: string
}

const TEXT_INPUT_TYPES: Record<string, string> = {
  text: 'text',
  email: 'email',
  tel: 'tel',
  date: 'date',
  number: 'number',
  currency: 'number',
  percent: 'number',
}

/**
 * Renders a single schema-defined field. Adding a new `FieldType` means adding
 * a case here — nothing else in the platform changes.
 */
export function FieldRenderer({ field, control, register, error }: FieldRendererProps) {
  const spanClass = field.colSpan === 1 ? 'sm:col-span-1' : 'sm:col-span-2'

  // ---- Presentational -------------------------------------------------------
  if (field.type === 'divider') {
    return <Separator className={cn('my-1', spanClass)} />
  }

  if (field.type === 'heading') {
    return (
      <h3 className={cn('pt-2 text-sm font-semibold tracking-tight', spanClass)}>{field.label}</h3>
    )
  }

  if (field.type === 'paragraph') {
    return (
      <p className={cn('rounded-lg border border-dashed bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground', spanClass)}>
        {field.label}
      </p>
    )
  }

  const labelNode = field.label ? (
    <Label htmlFor={field.id} className="flex items-baseline gap-1">
      {field.label}
      {field.required && (
        <span className="text-destructive" aria-hidden>
          *
        </span>
      )}
    </Label>
  ) : null

  const helpNode = field.helpText ? (
    <p className="text-xs text-muted-foreground">{field.helpText}</p>
  ) : null

  // ---- Single checkbox ------------------------------------------------------
  if (field.type === 'checkbox') {
    return (
      <div className={cn('space-y-2', spanClass)}>
        <Controller
          name={field.id}
          control={control}
          render={({ field: controlled }) => (
            <div className="flex items-start gap-3">
              <Checkbox
                id={field.id}
                checked={Boolean(controlled.value)}
                onCheckedChange={(checked) => controlled.onChange(checked === true)}
                className="mt-0.5"
                aria-invalid={Boolean(error)}
              />
              <Label htmlFor={field.id} className="text-sm font-normal leading-relaxed">
                {field.label}
                {field.required && (
                  <span className="ml-1 text-destructive" aria-hidden>
                    *
                  </span>
                )}
              </Label>
            </div>
          )}
        />
        {helpNode}
        <FieldError message={error} />
      </div>
    )
  }

  // ---- Checkbox group -------------------------------------------------------
  if (field.type === 'checkbox-group') {
    return (
      <div className={cn('space-y-2', spanClass)}>
        {labelNode}
        <Controller
          name={field.id}
          control={control}
          render={({ field: controlled }) => {
            const values = Array.isArray(controlled.value) ? (controlled.value as string[]) : []
            return (
              <div className="grid gap-2 sm:grid-cols-2">
                {(field.options ?? []).map((option) => (
                  <div key={option.value} className="flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                      id={`${field.id}-${option.value}`}
                      checked={values.includes(option.value)}
                      onCheckedChange={(checked) =>
                        controlled.onChange(
                          checked === true
                            ? [...values, option.value]
                            : values.filter((value) => value !== option.value),
                        )
                      }
                      className="mt-0.5"
                    />
                    <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal leading-relaxed">
                      {option.label}
                      {option.description && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )
          }}
        />
        {helpNode}
        <FieldError message={error} />
      </div>
    )
  }

  // ---- Radio / yes-no -------------------------------------------------------
  if (field.type === 'radio' || field.type === 'yesno') {
    const options =
      field.type === 'yesno'
        ? [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]
        : (field.options ?? [])

    return (
      <div className={cn('space-y-2', spanClass)}>
        {labelNode}
        <Controller
          name={field.id}
          control={control}
          render={({ field: controlled }) => (
            <div
              role="radiogroup"
              aria-label={field.label}
              className={cn('grid gap-2', field.type === 'yesno' ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}
            >
              {options.map((option) => {
                const checked = controlled.value === option.value
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
                      checked ? 'border-accent bg-accent/10' : 'hover:bg-muted/50',
                    )}
                  >
                    <input
                      type="radio"
                      name={field.id}
                      value={option.value}
                      checked={checked}
                      onChange={() => controlled.onChange(option.value)}
                      className="mt-0.5 h-4 w-4 accent-current text-accent"
                    />
                    <span>
                      {option.label}
                      {'description' in option && option.description && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        />
        {helpNode}
        <FieldError message={error} />
      </div>
    )
  }

  // ---- Select ---------------------------------------------------------------
  if (field.type === 'select') {
    return (
      <div className={cn('space-y-2', spanClass)}>
        {labelNode}
        <Controller
          name={field.id}
          control={control}
          render={({ field: controlled }) => (
            <Select
              value={typeof controlled.value === 'string' ? controlled.value : ''}
              onValueChange={controlled.onChange}
            >
              <SelectTrigger id={field.id} aria-invalid={Boolean(error)}>
                <SelectValue placeholder={field.placeholder ?? 'Please choose…'} />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {helpNode}
        <FieldError message={error} />
      </div>
    )
  }

  // ---- Textarea -------------------------------------------------------------
  if (field.type === 'textarea') {
    return (
      <div className={cn('space-y-2', spanClass)}>
        {labelNode}
        <Textarea
          id={field.id}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
          {...register(field.id)}
        />
        {helpNode}
        <FieldError message={error} />
      </div>
    )
  }

  // ---- Text-like inputs -----------------------------------------------------
  return (
    <div className={cn('space-y-2', spanClass)}>
      {labelNode}
      <div className="relative">
        {field.type === 'currency' && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            £
          </span>
        )}
        <Input
          id={field.id}
          type={TEXT_INPUT_TYPES[field.type] ?? 'text'}
          inputMode={['number', 'currency', 'percent'].includes(field.type) ? 'decimal' : undefined}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
          className={cn(field.type === 'currency' && 'pl-7', field.type === 'percent' && 'pr-8')}
          {...register(field.id)}
        />
        {field.type === 'percent' && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        )}
      </div>
      {helpNode}
      <FieldError message={error} />
    </div>
  )
}

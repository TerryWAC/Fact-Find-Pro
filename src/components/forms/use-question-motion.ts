'use client'

import { useEffect, useRef } from 'react'

/** Reveal each question once on arrival, without hiding or remounting its input. */
export function useQuestionMotion(visibleQuestionKey: string) {
  const ref = useRef<HTMLFieldSetElement>(null)
  const seen = useRef(new WeakSet<Element>())

  useEffect(() => {
    const container = ref.current
    if (!container || typeof IntersectionObserver === 'undefined') return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compact = window.matchMedia('(max-width: 767px)').matches
    const animations = new Map<Element, Animation>()
    const questions = container.querySelectorAll<HTMLElement>('[data-question-id]')
    const observer = new IntersectionObserver((entries) => {
      let arrival = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const question = entry.target
        observer.unobserve(question)
        if (seen.current.has(question)) continue
        seen.current.add(question)
        if (reducedMotion.matches || question.contains(document.activeElement) || typeof question.animate !== 'function') continue

        const animation = question.animate([
          { opacity: 0.65, transform: `perspective(1000px) translate3d(0, ${compact ? 8 : 12}px, -8px) rotateX(${compact ? 1 : 2}deg)` },
          { opacity: 1, transform: 'none' },
        ], {
          duration: compact ? 280 : 380,
          delay: Math.min(arrival++, 3) * 30,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'backwards',
        })
        animations.set(question, animation)
        animation.onfinish = () => animations.delete(question)
      }
    }, { rootMargin: '0px 0px -16px 0px', threshold: 0 })

    for (const question of questions) {
      if (!seen.current.has(question)) observer.observe(question)
    }

    // Pause before a tap lands: cancelling here would move a small checkbox
    // between pointer-down and pointer-up and could swallow the click.
    const pauseQuestion = (event: Event) => {
      const question = event.target instanceof Element ? event.target.closest('[data-question-id]') : null
      if (!question) return
      seen.current.add(question)
      observer.unobserve(question)
      animations.get(question)?.pause()
    }
    const settleQuestion = (event: Event) => {
      const question = event.target instanceof Element ? event.target.closest('[data-question-id]') : null
      if (!question) return
      if (event instanceof FocusEvent && event.relatedTarget instanceof Node && question.contains(event.relatedTarget)) return
      animations.get(question)?.cancel()
      animations.delete(question)
    }
    const stopForReducedMotion = () => {
      if (!reducedMotion.matches) return
      observer.disconnect()
      for (const question of questions) seen.current.add(question)
      for (const animation of animations.values()) animation.cancel()
      animations.clear()
    }
    container.addEventListener('focusin', pauseQuestion)
    container.addEventListener('pointerdown', pauseQuestion)
    container.addEventListener('click', settleQuestion)
    container.addEventListener('pointercancel', settleQuestion)
    container.addEventListener('keydown', settleQuestion)
    container.addEventListener('focusout', settleQuestion)
    reducedMotion.addEventListener('change', stopForReducedMotion)
    return () => {
      observer.disconnect()
      container.removeEventListener('focusin', pauseQuestion)
      container.removeEventListener('pointerdown', pauseQuestion)
      container.removeEventListener('click', settleQuestion)
      container.removeEventListener('pointercancel', settleQuestion)
      container.removeEventListener('keydown', settleQuestion)
      container.removeEventListener('focusout', settleQuestion)
      reducedMotion.removeEventListener('change', stopForReducedMotion)
      for (const animation of animations.values()) animation.cancel()
    }
  }, [visibleQuestionKey])

  return ref
}

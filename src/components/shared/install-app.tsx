'use client'

import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface InstallPrompt extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallApp({ name }: { name: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)')
    const sync = () => setInstalled(standalone.matches)
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt) }
    const finish = () => { setInstalled(true); setPrompt(null); setOpen(false) }
    sync()
    standalone.addEventListener('change', sync)
    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', finish)
    return () => {
      standalone.removeEventListener('change', sync)
      window.removeEventListener('beforeinstallprompt', capture)
      window.removeEventListener('appinstalled', finish)
    }
  }, [])
  if (installed) return null
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm"><Smartphone className="h-4 w-4" />Add to home screen</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle className="pr-8">Keep {name} close</DialogTitle>
        <DialogDescription>Open this workspace from your home screen or desktop, with a layout made for your device.</DialogDescription>
        {prompt ? <Button onClick={async () => {
          try {
            await prompt.prompt()
            const result = await prompt.userChoice
            if (result.outcome === 'accepted') setOpen(false)
          } finally { setPrompt(null) }
        }}>Install app</Button> : (
          <ol className="space-y-4 text-sm leading-relaxed">
            <li><strong>iPhone or iPad:</strong> open in Safari, tap Share, then Add to Home Screen.</li>
            <li><strong>Android:</strong> open Chrome’s menu, then Install app or Add to Home screen.</li>
            <li><strong>PC or Mac:</strong> use Chrome or Edge’s install option in the address bar or browser menu, where available.</li>
          </ol>
        )}
        <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">You’ll need an internet connection. Keep this page open until you submit; closing it clears unfinished answers.</p>
      </DialogContent>
    </Dialog>
  )
}

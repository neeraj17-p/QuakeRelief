'use client'

import { useEffect, useRef } from 'react'

/**
 * useVoiceAlertListener
 * 
 * Listens for cross-portal voice broadcast events via BroadcastChannel API.
 * When SEOC sends a "Voice + Text Alert", all portals (SEOC, Rescue, Citizen)
 * receive the event and invoke speechSynthesis.speak() locally.
 * 
 * Uses BroadcastChannel (cross-tab, same-origin) — zero dependencies.
 */
export function useVoiceAlertListener() {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const lastSpokenRef = useRef<string>('')

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel('qr-voice-alert')
    channelRef.current = channel

    channel.onmessage = (event) => {
      try {
        const { text, lang, id } = event.data
        if (!text || !lang || !id) return

        // Deduplicate: don't speak the same alert twice
        if (lastSpokenRef.current === id) return
        lastSpokenRef.current = id

        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel()

          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = lang
          utterance.rate = 0.95
          utterance.pitch = 1.0
          utterance.volume = 1.0

          // Match voice with Indian accent by BCP 47 language code
          const voices = window.speechSynthesis.getVoices()
          const matchedVoice = voices.find(v => v.lang.startsWith(lang))
          if (matchedVoice) {
            utterance.voice = matchedVoice
          }

          window.speechSynthesis.speak(utterance)
        }
      } catch {
        // Voice synthesis not supported — silent degradation
      }
    }

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [])

  return channelRef
}

/**
 * broadcastVoiceAlert
 * 
 * Posts a voice alert to all other open portals via BroadcastChannel.
 * Call this from the SEOC portal when sending a Voice + Text Alert.
 */
export function broadcastVoiceAlert(text: string, lang: string) {
  try {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('qr-voice-alert')
    const id = `va-${Date.now()}`
    channel.postMessage({ text, lang, id })
    // Close immediately — one-shot broadcast
    channel.close()
  } catch {
    // BroadcastChannel not supported — silent degradation
  }
}

'use client'

import { useEffect, useRef, useState } from 'react'

interface SpeechRecognitionResultLike {
  0: { transcript: string }
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  recordLabel: string
  stopLabel: string
  recordingLabel: string
  notSupportedLabel: string
}

// Speech-to-text via the browser's native Web Speech API — no external
// service or API key. Only reliably available in Chromium-based browsers,
// so this degrades to a plain message elsewhere.
export default function VoiceRecorder({
  onTranscript, recordLabel, stopLabel, recordingLabel, notSupportedLabel,
}: VoiceRecorderProps) {
  const [supported, setSupported] = useState(false)
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition))
  }, [])

  if (!supported) {
    return <p className="text-xs text-gray-400">{notSupportedLabel}</p>
  }

  function start() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = 'sv-SE'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = event => {
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      if (text) onTranscript(text)
    }
    recognition.onend = () => setRecording(false)
    recognition.onerror = () => setRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  function stop() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      className={`text-sm border rounded-lg px-3 py-2 transition ${
        recording ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {recording ? `🔴 ${stopLabel}` : `🎙️ ${recordLabel}`}
      {recording && <span className="ml-1 text-xs">({recordingLabel})</span>}
    </button>
  )
}

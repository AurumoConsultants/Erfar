// Generates the Swedish narration audio via ElevenLabs, using the
// with-timestamps endpoint so scene durations can be synced exactly to the
// real recorded speech instead of an estimated words-per-second guess.
// Requires ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in apps/videos/.env
import { writeFile } from 'fs/promises'
import path from 'path'

const apiKey = process.env.ELEVENLABS_API_KEY
const voiceId = process.env.ELEVENLABS_VOICE_ID

if (!apiKey || !voiceId) {
  console.error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID (set them in apps/videos/.env)')
  process.exit(1)
}

// Each entry is one video scene's narration line.
const lines = [
  'Varje byggprojekt ger nya lärdomar.',
  'Men hur ofta går den kunskapen förlorad mellan projekten?',
  'Möt Erfar — en ny digital plattform för erfarenhetsåterföring i byggbranschen.',
  'Samla utmaningar och framgångar direkt i projektet.',
  'Logga en lärdom på sekunder, med bilder, taggar och rätt kategori.',
  'Sök i en växande kunskapsbank när nästa projekt planeras.',
  'Klienter, entreprenörer och åskådare — alla på samma plattform.',
  'Bygg smartare. Lär er tillsammans. Välkommen till Erfar.',
]
const fullText = lines.join(' ')

async function main() {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: fullText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`ElevenLabs error ${res.status}: ${body}`)
    process.exit(1)
  }

  const data = await res.json()
  const audioBuffer = Buffer.from(data.audio_base64, 'base64')
  const audioPath = path.join(process.cwd(), 'public', 'narration.mp3')
  await writeFile(audioPath, audioBuffer)
  console.log(`Saved narration to ${audioPath} (${audioBuffer.length} bytes)`)

  // Map each line to its [start, end] time in the full audio by locating its
  // characters in the alignment data.
  const chars = data.alignment.characters
  const starts = data.alignment.character_start_times_seconds
  const ends = data.alignment.character_end_times_seconds

  let cursor = 0
  const timings = []
  for (const line of lines) {
    const lineStartIdx = fullText.indexOf(line, cursor)
    const lineEndIdx = lineStartIdx + line.length - 1
    timings.push({
      text: line,
      startSeconds: starts[lineStartIdx],
      endSeconds: ends[lineEndIdx],
    })
    cursor = lineEndIdx + 1
  }

  const timingPath = path.join(process.cwd(), 'src', 'narration-timing.json')
  await writeFile(timingPath, JSON.stringify({ totalDuration: ends[ends.length - 1], lines: timings }, null, 2))
  console.log(`Saved timing to ${timingPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })

// Generates the Swedish narration audio via ElevenLabs.
// Requires ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in apps/videos/.env
import { writeFile, readFile } from 'fs/promises'
import path from 'path'

const apiKey = process.env.ELEVENLABS_API_KEY
const voiceId = process.env.ELEVENLABS_VOICE_ID

if (!apiKey || !voiceId) {
  console.error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID (set them in apps/videos/.env)')
  process.exit(1)
}

const script = [
  'Varje byggprojekt ger nya lärdomar.',
  'Men hur ofta går den kunskapen förlorad mellan projekten?',
  'Möt Erfar — en ny digital plattform för erfarenhetsåterföring i byggbranschen.',
  'Samla utmaningar och framgångar direkt i projektet.',
  'Logga en lärdom på sekunder, med bilder, taggar och rätt kategori.',
  'Sök i en växande kunskapsbank när nästa projekt planeras.',
  'Klienter, entreprenörer och åskådare — alla på samma plattform.',
  'Bygg smartare. Lär er tillsammans. Välkommen till Erfar.',
].join(' ')

async function main() {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`ElevenLabs error ${res.status}: ${body}`)
    process.exit(1)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const outPath = path.join(process.cwd(), 'public', 'narration.mp3')
  await writeFile(outPath, buffer)
  console.log(`Saved narration to ${outPath} (${buffer.length} bytes)`)
}

main().catch(e => { console.error(e); process.exit(1) })

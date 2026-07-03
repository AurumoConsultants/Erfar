import { Series, Audio, staticFile } from 'remotion'
import { LogoScene } from './components/LogoScene'
import { TextScene } from './components/TextScene'
import { ScreenshotScene } from './components/ScreenshotScene'
import narrationTiming from './narration-timing.json'

// Scene durations are derived from the real recorded narration timing
// (src/narration-timing.json, produced by `pnpm narrate`), not an estimate —
// each scene runs exactly as long as its corresponding line of speech takes,
// so visuals always match what's being said.
const FPS = 30
const END_HOLD_SECONDS = 1.5

const sceneStarts = narrationTiming.lines.map(l => l.startSeconds)
const sceneEndsForDuration = [...sceneStarts.slice(1), narrationTiming.totalDuration + END_HOLD_SECONDS]
const durationsInFrames = sceneStarts.map((start, i) => Math.round((sceneEndsForDuration[i] - start) * FPS))

export const totalIntroVideoFrames = durationsInFrames.reduce((sum, d) => sum + d, 0)

export const IntroVideo: React.FC = () => {
  return (
    <>
      <Audio src={staticFile('narration.mp3')} />
      <Series>
        <Series.Sequence durationInFrames={durationsInFrames[0]}>
          <TextScene text="Varje byggprojekt ger nya lärdomar." />
        </Series.Sequence>

        <Series.Sequence durationInFrames={durationsInFrames[1]}>
          <TextScene text="Men hur ofta går den kunskapen förlorad mellan projekten?" />
        </Series.Sequence>

        <Series.Sequence durationInFrames={durationsInFrames[2]}>
          <LogoScene caption="En ny digital plattform för erfarenhetsåterföring i byggbranschen." />
        </Series.Sequence>

        <Series.Sequence durationInFrames={durationsInFrames[3]}>
          <ScreenshotScene src="screenshots/01-homepage.png" caption="Samla utmaningar och framgångar direkt i projektet." />
        </Series.Sequence>

        <Series.Sequence durationInFrames={durationsInFrames[4]}>
          <ScreenshotScene src="screenshots/04-log-lesson.png" caption="Logga en lärdom på sekunder — med bilder, taggar och rätt kategori." />
        </Series.Sequence>

        <Series.Sequence durationInFrames={durationsInFrames[5]}>
          <ScreenshotScene src="screenshots/05-knowledge-base.png" caption="Sök i en växande kunskapsbank när nästa projekt planeras." />
        </Series.Sequence>

        <Series.Sequence durationInFrames={durationsInFrames[6]}>
          <ScreenshotScene src="screenshots/02-dashboard.png" caption="Klienter, entreprenörer och åskådare — alla på samma plattform." />
        </Series.Sequence>

        <Series.Sequence durationInFrames={durationsInFrames[7]}>
          <LogoScene caption="Bygg smartare. Lär er tillsammans. Välkommen till Erfar." />
        </Series.Sequence>
      </Series>
    </>
  )
}

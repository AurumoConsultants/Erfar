import { Series } from 'remotion'
import { LogoScene } from './components/LogoScene'
import { TextScene } from './components/TextScene'
import { ScreenshotScene } from './components/ScreenshotScene'

// Scene durations are paced to the Swedish narration in script.sv.md
// (~2.3 words/sec). Once public/narration.mp3 exists (via `pnpm narrate`),
// add: <Audio src={staticFile('narration.mp3')} /> as the first child below,
// and re-check these durations against the real recorded audio length.
export const IntroVideo: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={90}>
        <TextScene text="Varje byggprojekt ger nya lärdomar." />
      </Series.Sequence>

      <Series.Sequence durationInFrames={120}>
        <TextScene text="Men hur ofta går den kunskapen förlorad mellan projekten?" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={165}>
        <LogoScene caption="En ny digital plattform för erfarenhetsåterföring i byggbranschen." />
      </Series.Sequence>

      <Series.Sequence durationInFrames={105}>
        <ScreenshotScene src="screenshots/01-homepage.png" caption="Samla utmaningar och framgångar direkt i projektet." />
      </Series.Sequence>

      <Series.Sequence durationInFrames={150}>
        <ScreenshotScene src="screenshots/04-log-lesson.png" caption="Logga en lärdom på sekunder — med bilder, taggar och rätt kategori." />
      </Series.Sequence>

      <Series.Sequence durationInFrames={135}>
        <ScreenshotScene src="screenshots/05-knowledge-base.png" caption="Sök i en växande kunskapsbank när nästa projekt planeras." />
      </Series.Sequence>

      <Series.Sequence durationInFrames={120}>
        <ScreenshotScene src="screenshots/02-dashboard.png" caption="Klienter, entreprenörer och åskådare — alla på samma plattform." />
      </Series.Sequence>

      <Series.Sequence durationInFrames={150}>
        <LogoScene caption="Bygg smartare. Lär er tillsammans. Välkommen till Erfar." />
      </Series.Sequence>
    </Series>
  )
}

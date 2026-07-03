import { Composition } from 'remotion'
import { IntroTutorial } from './IntroTutorial'
import { IntroVideo, totalIntroVideoFrames } from './IntroVideo'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IntroVideo"
        component={IntroVideo}
        durationInFrames={totalIntroVideoFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="IntroTutorial"
        component={IntroTutorial}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}

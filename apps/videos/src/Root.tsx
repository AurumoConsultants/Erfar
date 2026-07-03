import { Composition } from 'remotion'
import { IntroTutorial } from './IntroTutorial'

export const RemotionRoot: React.FC = () => {
  return (
    <>
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

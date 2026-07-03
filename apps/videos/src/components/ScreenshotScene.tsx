import { Img, staticFile, useCurrentFrame, interpolate } from 'remotion'
import { SceneBackground } from './SceneBackground'

export const ScreenshotScene: React.FC<{ src: string; caption: string }> = ({ src, caption }) => {
  const frame = useCurrentFrame()
  const imageProgress = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const captionOpacity = interpolate(frame, [8, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <SceneBackground>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 48,
        }}
      >
        <div
          style={{
            opacity: imageProgress,
            transform: `scale(${0.94 + imageProgress * 0.06})`,
            width: 1400,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Img src={staticFile(src)} style={{ width: '100%', display: 'block' }} />
        </div>
        <div
          style={{
            opacity: captionOpacity,
            fontSize: 44,
            color: 'white',
            fontFamily: 'sans-serif',
            fontWeight: 500,
            textAlign: 'center',
            padding: '0 160px',
          }}
        >
          {caption}
        </div>
      </div>
    </SceneBackground>
  )
}

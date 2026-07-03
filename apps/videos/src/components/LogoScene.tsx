import { Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { SceneBackground } from './SceneBackground'

export const LogoScene: React.FC<{ caption?: string }> = ({ caption }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoScale = spring({ frame, fps, config: { damping: 200 } })
  const captionOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <SceneBackground>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: `scale(${logoScale})`,
            background: 'white',
            borderRadius: 32,
            padding: '40px 56px',
          }}
        >
          <Img src={staticFile('logo.png')} style={{ height: 140 }} />
        </div>
        {caption && (
          <div
            style={{
              opacity: captionOpacity,
              marginTop: 44,
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
        )}
      </div>
    </SceneBackground>
  )
}

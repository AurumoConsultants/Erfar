import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'

export const IntroTutorial: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoScale = spring({ frame, fps, config: { damping: 200 } })
  const taglineOpacity = interpolate(frame, [40, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${logoScale})`,
          background: 'white',
          borderRadius: 32,
          padding: '48px 64px',
        }}
      >
        <Img src={staticFile('logo.png')} style={{ height: 160 }} />
      </div>
      <div
        style={{
          opacity: taglineOpacity,
          marginTop: 48,
          fontSize: 48,
          color: 'white',
          fontFamily: 'sans-serif',
          fontWeight: 500,
        }}
      >
        Kunskapsbank för lärdomar från byggprojekt
      </div>
    </AbsoluteFill>
  )
}

import { useCurrentFrame, interpolate } from 'remotion'
import { SceneBackground } from './SceneBackground'

export const TextScene: React.FC<{ text: string; big?: boolean }> = ({ text, big }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const translateY = interpolate(frame, [0, 15], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <SceneBackground>
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 160px',
        }}
      >
        <div
          style={{
            opacity,
            transform: `translateY(${translateY}px)`,
            color: 'white',
            fontFamily: 'sans-serif',
            fontWeight: 600,
            fontSize: big ? 72 : 56,
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {text}
        </div>
      </div>
    </SceneBackground>
  )
}

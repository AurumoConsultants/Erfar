import { AbsoluteFill } from 'remotion'

export const SceneBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)' }}>
    {children}
  </AbsoluteFill>
)

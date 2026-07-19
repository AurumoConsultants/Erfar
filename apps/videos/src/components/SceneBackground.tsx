import { AbsoluteFill } from 'remotion'

export const SceneBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(135deg, #152432, #233b53)' }}>
    {children}
  </AbsoluteFill>
)

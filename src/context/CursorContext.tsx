import React, { createContext, useContext, useState, useMemo } from 'react'
import { ParticlesCursor, FluidCursor, SmokeyCursor } from '../components/cursors'

export type CursorType = 'particles' | 'fluid' | 'smokey' | 'none'

export interface CursorContextValue {
  cursorType: CursorType
  setCursorType: (type: CursorType) => void
  cursorColor: string
  setCursorColor: (color: string) => void
  particleCount: number
  setParticleCount: (count: number) => void
}

const CursorContext = createContext<CursorContextValue | undefined>(undefined)

export interface CursorProviderProps {
  children: React.ReactNode
  defaultCursor?: CursorType
  defaultColor?: string
  defaultParticleCount?: number
}

export const CursorProvider: React.FC<CursorProviderProps> = ({
  children,
  defaultCursor = 'particles',
  defaultColor = '#a855f7',
  defaultParticleCount = 1000,
}) => {
  const [cursorType, setCursorType] = useState<CursorType>(defaultCursor)
  const [cursorColor, setCursorColor] = useState<string>(defaultColor)
  const [particleCount, setParticleCount] = useState<number>(defaultParticleCount)

  const value = useMemo(
    () => ({
      cursorType,
      setCursorType,
      cursorColor,
      setCursorColor,
      particleCount,
      setParticleCount,
    }),
    [cursorType, cursorColor, particleCount]
  )

  return (
    <CursorContext.Provider value={value}>
      {cursorType === 'particles' && (
        <ParticlesCursor color={cursorColor} particleCount={particleCount} />
      )}
      {cursorType === 'fluid' && <FluidCursor color={cursorColor} />}
      {cursorType === 'smokey' && <SmokeyCursor color={cursorColor} />}
      {children}
    </CursorContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCursor = (): CursorContextValue => {
  const context = useContext(CursorContext)
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider')
  }
  return context
}

export default CursorProvider

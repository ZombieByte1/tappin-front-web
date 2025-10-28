import { createContext, useContext, useRef } from 'react'

const ScrollContext = createContext()

export const ScrollProvider = ({ children }) => {
  const scrollPositions = useRef({})

  const saveScroll = (key, position) => {
    scrollPositions.current[key] = position
  }

  const getScroll = (key) => {
    return scrollPositions.current[key] || 0
  }

  return (
    <ScrollContext.Provider value={{ saveScroll, getScroll }}>
      {children}
    </ScrollContext.Provider>
  )
}

export const useScroll = () => {
  const context = useContext(ScrollContext)
  if (!context) {
    throw new Error('useScroll debe usarse dentro de ScrollProvider')
  }
  return context
}

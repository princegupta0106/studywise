import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const PageTransition = ({ children }) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState("fadeIn")

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut")
    }
  }, [location, displayLocation])

  useEffect(() => {
    if (transitionStage === "fadeOut") {
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage("fadeIn")
      }, 150) // Half the transition duration
      return () => clearTimeout(timer)
    }
  }, [transitionStage, location])

  return (
    <div
      className={`page-transition ${transitionStage}`}
      style={{
        transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
        opacity: transitionStage === "fadeOut" ? 0 : 1,
        transform: transitionStage === "fadeOut" ? 'translateY(10px)' : 'translateY(0)',
      }}
    >
      {React.cloneElement(children, { location: displayLocation })}
    </div>
  )
}

export default PageTransition
'use client'

import { useState, useEffect } from 'react'

/**
 * Component that displays a notice on mobile devices indicating the app is desktop-only.
 * 
 * @returns The mobile notice component or null if on desktop
 */
export default function MobileNotice() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    /**
     * Checks if the current device is a mobile device (not tablet).
     * 
     * @returns True if the device is mobile (phone, not tablet)
     */
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor
      const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase())
      // Check for tablets specifically and exclude them
      const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent.toLowerCase()) || 
                      (window.innerWidth >= 768 && window.innerWidth < 1024)
      const isSmallScreen = window.innerWidth < 768 // md breakpoint (tablet and below)
      // Show notice only on phones, not tablets
      return (isMobileDevice && !isTablet) || (isSmallScreen && !isTablet)
    }

    setIsMobile(checkMobile())

    const handleResize = () => {
      setIsMobile(checkMobile())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isMobile) return null

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-2xl font-bold text-gray-900">Desktop Only</h2>
        <p className="text-gray-600">
          This application is optimized for desktop use. Please access it from a
          computer or tablet in landscape mode for the best experience.
        </p>
        <p className="text-sm text-gray-500">
          The interactive graph requires precise mouse control and a larger screen
          to function properly.
        </p>
      </div>
    </div>
  )
}


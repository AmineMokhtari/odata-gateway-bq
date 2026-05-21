'use client'

import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (process.env.NEXT_PUBLIC_API_MOCKING === 'true') {
        const { worker } = await import('../mocks/browser')
        await worker.start({
          serviceWorker: {
            url: '/web/mockServiceWorker.js',
            options: {
              scope: '/web/'
            }
          },
          onUnhandledRequest: 'bypass',
        })
      }
      setMswReady(true)
    }

    if (!mswReady) {
      init()
    }
  }, [mswReady])

  if (process.env.NEXT_PUBLIC_API_MOCKING === 'true' && !mswReady) {
    return null // Or a loading spinner
  }

  return <>{children}</>
}

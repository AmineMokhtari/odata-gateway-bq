/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
'use client'

import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        if (process.env.NEXT_PUBLIC_API_MOCKING === 'true') {
          const { worker } = await import('../mocks/browser')
          await worker.start({
            serviceWorker: {
              url: '/web/mockServiceWorker.js',
              options: {
                scope: '/'
              }
            },
            onUnhandledRequest: 'bypass',
          })
        }
      } catch (error) {
        console.error('[MSW] failed to start mock service worker:', error)
      } finally {
        setMswReady(true)
      }
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

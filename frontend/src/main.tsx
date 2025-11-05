import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/providers/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query/queryClient'
import { applyChartJSTheme } from './lib/charting/chartjs-theme'

function Root() {
  useEffect(() => {
    applyChartJSTheme()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

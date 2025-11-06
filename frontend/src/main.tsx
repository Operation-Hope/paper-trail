import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider, useTheme } from './components/providers/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query/queryClient'
import { applyChartJSTheme } from './lib/charting/chartjs-theme'

function ChartThemeSync() {
  const { theme } = useTheme()

  useEffect(() => {
    applyChartJSTheme(theme)
  }, [theme])

  return null
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <ChartThemeSync />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)

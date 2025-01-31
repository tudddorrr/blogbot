import { ThemeProvider } from '@/components/theme-provider'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <body className="antialiased p-8">
          <Main />
          <NextScript />
        </body>
      </ThemeProvider>
    </Html>         
  )
}


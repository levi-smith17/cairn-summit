import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme/provider'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const josefinSans = localFont({
  src: [
    {
      path: '../../public/fonts/JosefinSans-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/JosefinSans-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/JosefinSans-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-josefin-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'cairn',
  description: 'For Your Personal Journey',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${josefinSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
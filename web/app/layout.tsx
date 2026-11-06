import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Noack Web",
  description: "Frontend mit Next.js, TypeScript, Tailwind und shadcn-Struktur",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  )
}

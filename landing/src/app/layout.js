import './globals.css';

export const metadata = {
  title: 'Vyron Intelligence — Dominate YouTube',
  description: 'Real-time YouTube analytics, viral trend radar, and competitor intelligence.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

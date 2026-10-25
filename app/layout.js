import './globals.css';

export const metadata = {
  title: 'RifaPro Master',
  description: 'Sistema Profissional de Rifas e Afiliados',
  manifest: '/manifest.json',
  themeColor: '#020617',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RifaPro Master',
  },
};

export const viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/2554/2554896.png" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

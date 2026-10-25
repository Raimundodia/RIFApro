import './globals.css';

export const metadata = {
  title: 'Sistema Profissional de Rifas e Afiliados',
  description: 'Gestão de rifas, vendas por afiliados e sorteios.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

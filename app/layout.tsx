import type { Metadata } from "next";
import "./globals.css";
import "./glass.css";

export const metadata: Metadata = {
  title: "Finanças",
  description: "Seu painel pessoal para organizar gastos e construir patrimônio.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}

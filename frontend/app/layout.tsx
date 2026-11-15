import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FitQuality · Member data office',
  description: 'Role-based fitness operations, health screening, and member data quality workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


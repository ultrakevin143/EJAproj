import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FitQuality DQM — Gym Member Health Screening Quality Detective',
  description: 'Data Quality Management & Governance System for Gym Member Screening Records',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}


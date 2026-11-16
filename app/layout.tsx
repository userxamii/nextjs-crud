import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js CRUD Task Manager',
  description: 'A simple CRUD application using Next.js and SQLite',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'ShipForge — Logistics Order Management',
  description: 'Create and manage logistics shipment orders with real-time preview',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={styles.body}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

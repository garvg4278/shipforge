'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function HomePage() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  return (
    <div className={styles.page}>
      <div className={styles.loadingShell}>
        <div className={styles.spinner} aria-label="Loading..." />
      </div>
    </div>
  );
}

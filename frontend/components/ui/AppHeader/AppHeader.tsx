'use client';

import styles from './AppHeader.module.css';

interface AppHeaderProps {
  orderId: string;
}

export default function AppHeader({ orderId }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className={styles.brandName}>ShipForge</span>
          <span className={styles.brandDivider} aria-hidden="true" />
          <span className={styles.brandSub}>Logistics Platform</span>
        </div>
        {orderId && (
          <div className={styles.meta}>
            <span className={styles.metaLabel}>Order</span>
            <code className={styles.orderId}>{orderId}</code>
          </div>
        )}
      </div>
    </header>
  );
}

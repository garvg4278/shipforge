'use client';

import { memo } from 'react';
import styles from './StatusBadge.module.css';

type Status = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; icon: string; cls: string }> = {
  PENDING:          { label: 'Pending',         icon: '⏳', cls: 'pending' },
  PROCESSING:       { label: 'Processing',       icon: '⚙️', cls: 'processing' },
  SHIPPED:          { label: 'Shipped',          icon: '🚚', cls: 'shipped' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: '📍', cls: 'outForDelivery' },
  DELIVERED:        { label: 'Delivered',        icon: '✅', cls: 'delivered' },
  CANCELLED:        { label: 'Cancelled',        icon: '❌', cls: 'cancelled' },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

const StatusBadge = memo(function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || { label: status, icon: '●', cls: 'pending' };
  return (
    <span className={`${styles.badge} ${styles[cfg.cls]} ${size === 'sm' ? styles.sm : ''}`}>
      <span className={styles.icon} aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
});

export default StatusBadge;

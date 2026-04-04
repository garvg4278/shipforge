'use client';

import { memo } from 'react';
import { DeliveryType } from '@/types';
import styles from './DeliveryTypePicker.module.css';

interface DeliveryTypePickerProps {
  value: DeliveryType;
  onChange: (value: DeliveryType) => void;
}

const DeliveryTypePicker = memo(function DeliveryTypePicker({
  value,
  onChange,
}: DeliveryTypePickerProps) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label="Delivery Type">
      <button
        type="button"
        role="radio"
        aria-checked={value === 'standard'}
        className={`${styles.option} ${value === 'standard' ? styles.selectedStandard : ''}`}
        onClick={() => onChange('standard')}
      >
        <span className={styles.optionIcon} aria-hidden="true">📦</span>
        <div className={styles.optionContent}>
          <span className={styles.optionLabel}>Standard</span>
          <span className={styles.optionMeta}>3–7 business days</span>
        </div>
        <span className={styles.optionCheck} aria-hidden="true">
          {value === 'standard' && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'express'}
        className={`${styles.option} ${value === 'express' ? styles.selectedExpress : ''}`}
        onClick={() => onChange('express')}
      >
        <span className={styles.optionIcon} aria-hidden="true">⚡</span>
        <div className={styles.optionContent}>
          <span className={styles.optionLabel}>Express</span>
          <span className={styles.optionMeta}>1–2 business days</span>
        </div>
        <span className={styles.optionCheck} aria-hidden="true">
          {value === 'express' && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </button>
    </div>
  );
});

export default DeliveryTypePicker;

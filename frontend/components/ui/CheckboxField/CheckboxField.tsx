'use client';

import { memo } from 'react';
import styles from './CheckboxField.module.css';

interface CheckboxFieldProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accent?: 'purple' | 'cyan';
}

const CheckboxField = memo(function CheckboxField({
  id,
  label,
  description,
  checked,
  onChange,
  accent = 'purple',
}: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className={`${styles.wrapper} ${checked ? styles.checked : ''} ${styles[accent]}`}
    >
      <div className={styles.checkboxOuter}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={styles.hiddenInput}
          aria-describedby={description ? `${id}_desc` : undefined}
        />
        <div className={styles.checkboxVisual} aria-hidden="true">
          {checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        {description && (
          <span id={`${id}_desc`} className={styles.description}>{description}</span>
        )}
      </div>
    </label>
  );
});

export default CheckboxField;

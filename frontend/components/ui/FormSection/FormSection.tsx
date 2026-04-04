'use client';

import { ReactNode, memo } from 'react';
import styles from './FormSection.module.css';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  accent?: 'default' | 'orange' | 'blue' | 'purple';
}

const FormSection = memo(function FormSection({
  title,
  subtitle,
  icon,
  children,
  accent = 'default',
}: FormSectionProps) {
  return (
    <section className={`${styles.section} ${styles[accent]}`} aria-labelledby={`section_${title.replace(/\s+/g, '_')}`}>
      <div className={styles.header}>
        {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
        <div className={styles.titleGroup}>
          <h2 id={`section_${title.replace(/\s+/g, '_')}`} className={styles.title}>
            {title}
          </h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
});

export default FormSection;

'use client';

import { InputHTMLAttributes, memo } from 'react';
import styles from './InputField.module.css';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

const InputField = memo(function InputField({
  label,
  error,
  hint,
  prefix,
  suffix,
  id,
  className,
  ...props
}: InputFieldProps) {
  const fieldId = id || `field_${label.toLowerCase().replace(/\s+/g, '_')}`;

  return (
    <div className={`${styles.wrapper} ${error ? styles.hasError : ''}`}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
        {props.required && <span className={styles.required} aria-hidden="true">*</span>}
      </label>
      <div className={styles.inputWrapper}>
        {prefix && <span className={styles.prefix} aria-hidden="true">{prefix}</span>}
        <input
          id={fieldId}
          className={`${styles.input} ${prefix ? styles.hasPrefix : ''} ${suffix ? styles.hasSuffix : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}_error` : hint ? `${fieldId}_hint` : undefined}
          {...props}
        />
        {suffix && <span className={styles.suffix} aria-hidden="true">{suffix}</span>}
      </div>
      {error && (
        <p id={`${fieldId}_error`} className={styles.errorMsg} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${fieldId}_hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
});

export default InputField;

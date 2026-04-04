'use client';

import { memo } from 'react';
import { Package } from '@/types';
import InputField from '@/components/ui/InputField/InputField';
import styles from './PackageCard.module.css';

interface PackageCardProps {
  pkg: Package;
  index: number;
  canRemove: boolean;
  onChange: (id: string, field: keyof Package, value: string) => void;
  onRemove: (id: string) => void;
  errors?: Record<string, string>;
}

const PackageCard = memo(function PackageCard({
  pkg,
  index,
  canRemove,
  onChange,
  onRemove,
  errors = {},
}: PackageCardProps) {
  const errKey = `packages.${index}`;

  return (
    <article className={styles.card} aria-label={`Package ${index + 1}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIndex}>
          <span className={styles.packageDot} aria-hidden="true" />
          <span className={styles.packageLabel}>
            Package <strong>{index + 1}</strong>
          </span>
          {pkg.label && (
            <span className={styles.packageName}>{pkg.label}</span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => onRemove(pkg.id)}
            aria-label={`Remove package ${index + 1}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Remove
          </button>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.fullWidth}>
          <InputField
            id={`${pkg.id}_label`}
            label="Package Label / Name"
            placeholder="e.g. Electronics Box, Gift Set"
            value={pkg.label}
            onChange={(e) => onChange(pkg.id, 'label', e.target.value)}
            error={errors[`${errKey}.label`]}
            required
          />
        </div>

        <div className={styles.row2}>
          <InputField
            id={`${pkg.id}_weight`}
            label="Weight"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="0.0"
            value={pkg.weight}
            onChange={(e) => onChange(pkg.id, 'weight', e.target.value)}
            error={errors[`${errKey}.weight`]}
            suffix="kg"
            required
            inputMode="decimal"
          />
          <InputField
            id={`${pkg.id}_value`}
            label="Declared Value"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={pkg.declaredValue}
            onChange={(e) => onChange(pkg.id, 'declaredValue', e.target.value)}
            error={errors[`${errKey}.declaredValue`]}
            prefix="₹"
            required
            inputMode="numeric"
          />
        </div>

        <div className={styles.dimensionsRow}>
          <div className={styles.dimensionsLabel}>
            <span>Dimensions</span>
            <span className={styles.dimensionsUnit}>(cm)</span>
          </div>
          <div className={styles.dimensionsInputs}>
            <InputField
              id={`${pkg.id}_length`}
              label="Length"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="L"
              value={pkg.length}
              onChange={(e) => onChange(pkg.id, 'length', e.target.value)}
              error={errors[`${errKey}.length`]}
              required
              inputMode="decimal"
            />
            <span className={styles.dimSeparator} aria-hidden="true">×</span>
            <InputField
              id={`${pkg.id}_width`}
              label="Width"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="W"
              value={pkg.width}
              onChange={(e) => onChange(pkg.id, 'width', e.target.value)}
              error={errors[`${errKey}.width`]}
              required
              inputMode="decimal"
            />
            <span className={styles.dimSeparator} aria-hidden="true">×</span>
            <InputField
              id={`${pkg.id}_height`}
              label="Height"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="H"
              value={pkg.height}
              onChange={(e) => onChange(pkg.id, 'height', e.target.value)}
              error={errors[`${errKey}.height`]}
              required
              inputMode="decimal"
            />
          </div>
        </div>
      </div>
    </article>
  );
});

export default PackageCard;

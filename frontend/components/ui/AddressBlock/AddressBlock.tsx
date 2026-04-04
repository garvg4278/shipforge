'use client';

import { memo } from 'react';
import { Address } from '@/types';
import InputField from '@/components/ui/InputField/InputField';
import styles from './AddressBlock.module.css';

interface AddressBlockProps {
  value: Address;
  onChange: (field: keyof Address, value: string) => void;
  errors?: Record<string, string>;
  prefix: string;
}

const AddressBlock = memo(function AddressBlock({
  value,
  onChange,
  errors = {},
  prefix,
}: AddressBlockProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.fullWidth}>
        <InputField
          id={`${prefix}_name`}
          label="Full Name"
          placeholder="e.g. Rahul Sharma"
          value={value.name}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors[`${prefix}.name`]}
          required
          autoComplete="name"
        />
      </div>
      <div className={styles.fullWidth}>
        <InputField
          id={`${prefix}_address`}
          label="Street Address"
          placeholder="e.g. 45 MG Road, Sector 12"
          value={value.address}
          onChange={(e) => onChange('address', e.target.value)}
          error={errors[`${prefix}.address`]}
          required
          autoComplete="street-address"
        />
      </div>
      <InputField
        id={`${prefix}_city`}
        label="City"
        placeholder="e.g. Mumbai"
        value={value.city}
        onChange={(e) => onChange('city', e.target.value)}
        error={errors[`${prefix}.city`]}
        required
        autoComplete="address-level2"
      />
      <InputField
        id={`${prefix}_pincode`}
        label="Pincode"
        placeholder="e.g. 400001"
        value={value.pincode}
        onChange={(e) => onChange('pincode', e.target.value)}
        error={errors[`${prefix}.pincode`]}
        required
        maxLength={6}
        inputMode="numeric"
        pattern="[0-9]{6}"
        autoComplete="postal-code"
        hint="6-digit Indian postal code"
      />
    </div>
  );
});

export default AddressBlock;

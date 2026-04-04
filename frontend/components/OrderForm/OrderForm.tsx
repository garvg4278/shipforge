'use client';

import { memo, useCallback, useState } from 'react';
import { OrderFormData, Package, DeliveryType, Address } from '@/types';
import { validateForm } from '@/utils';
import FormSection from '@/components/ui/FormSection/FormSection';
import InputField from '@/components/ui/InputField/InputField';
import AddressBlock from '@/components/ui/AddressBlock/AddressBlock';
import DeliveryTypePicker from '@/components/ui/DeliveryTypePicker/DeliveryTypePicker';
import CheckboxField from '@/components/ui/CheckboxField/CheckboxField';
import PackageCard from '@/components/PackageCard/PackageCard';
import styles from './OrderForm.module.css';

interface OrderFormProps {
  data: OrderFormData;
  onFieldChange: <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => void;
  onAddressChange: (party: 'consignor' | 'consignee', field: string, value: string) => void;
  onPackageChange: (id: string, field: keyof Package, value: string) => void;
  onAddPackage: () => void;
  onRemovePackage: (id: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  submitted: boolean;
}

const OrderForm = memo(function OrderForm({
  data,
  onFieldChange,
  onAddressChange,
  onPackageChange,
  onAddPackage,
  onRemovePackage,
  onSubmit,
  onReset,
  submitted,
}: OrderFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched(true);
      const validationErrors = validateForm(data);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length === 0) {
        onSubmit();
      }
    },
    [data, onSubmit]
  );

  const handleReset = useCallback(() => {
    setErrors({});
    setTouched(false);
    onReset();
  }, [onReset]);

  if (submitted) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon} aria-hidden="true">✓</div>
        <h2 className={styles.successTitle}>Order Submitted!</h2>
        <p className={styles.successMsg}>
          Your shipment order <code className={styles.successOrderId}>{data.orderId}</code> has been
          successfully created.
        </p>
        <button type="button" className={styles.resetBtn} onClick={handleReset}>
          Create New Order
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Create Shipment Order">
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>New Shipment Order</h1>
        <p className={styles.formSubtitle}>Fill in the details below to create a logistics order</p>
      </div>

      <div className={styles.sections}>
        {/* Shipment Details */}
        <FormSection
          title="Shipment Details"
          subtitle="Basic information about this shipment"
          icon="🚚"
          accent="orange"
        >
          <div className={styles.row2}>
            <InputField
              id="orderId"
              label="Order ID"
              value={data.orderId}
              readOnly
              hint="Auto-generated — cannot be modified"
            />
            <InputField
              id="shipmentDate"
              label="Shipment Date"
              type="date"
              value={data.shipmentDate}
              onChange={(e) => onFieldChange('shipmentDate', e.target.value)}
              error={touched ? errors.shipmentDate : undefined}
              required
            />
          </div>
          <div>
            <p className={styles.fieldLabel}>Delivery Type <span className={styles.required}>*</span></p>
            <DeliveryTypePicker
              value={data.deliveryType}
              onChange={(val: DeliveryType) => onFieldChange('deliveryType', val)}
            />
          </div>
        </FormSection>

        {/* Consignor */}
        <FormSection
          title="Consignor (Sender)"
          subtitle="Who is sending this shipment?"
          icon="📤"
          accent="blue"
        >
          <AddressBlock
            value={data.consignor}
            onChange={(field, val) => onAddressChange('consignor', field, val)}
            errors={touched ? errors : {}}
            prefix="consignor"
          />
        </FormSection>

        {/* Consignee */}
        <FormSection
          title="Consignee (Receiver)"
          subtitle="Who is receiving this shipment?"
          icon="📥"
          accent="blue"
        >
          <AddressBlock
            value={data.consignee}
            onChange={(field, val) => onAddressChange('consignee', field, val)}
            errors={touched ? errors : {}}
            prefix="consignee"
          />
        </FormSection>

        {/* Packages */}
        <FormSection
          title="Package Information"
          subtitle={`${data.packages.length} package${data.packages.length !== 1 ? 's' : ''} added`}
          icon="📦"
          accent="default"
        >
          <div className={styles.packagesList}>
            {data.packages.map((pkg, index) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                index={index}
                canRemove={data.packages.length > 1}
                onChange={onPackageChange}
                onRemove={onRemovePackage}
                errors={touched ? errors : {}}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.addPackageBtn}
            onClick={onAddPackage}
            aria-label="Add another package"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Package
          </button>
        </FormSection>

        {/* Additional Options */}
        <FormSection
          title="Additional Options"
          subtitle="Special handling instructions"
          icon="⚙️"
          accent="purple"
        >
          <div className={styles.checkboxGrid}>
            <CheckboxField
              id="fragile"
              label="Fragile Contents"
              description="Package requires careful handling and fragile stickers"
              checked={data.fragile}
              onChange={(val) => onFieldChange('fragile', val)}
              accent="purple"
            />
            <CheckboxField
              id="insurance"
              label="Insurance Required"
              description="Insure the declared value of all packages in this order"
              checked={data.insurance}
              onChange={(val) => onFieldChange('insurance', val)}
              accent="cyan"
            />
          </div>
        </FormSection>
      </div>

      {/* Form Actions */}
      <div className={styles.formActions}>
        <button type="button" className={styles.btnSecondary} onClick={handleReset}>
          Reset Form
        </button>
        <button type="submit" className={styles.btnPrimary}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Submit Order
        </button>
      </div>
    </form>
  );
});

export default OrderForm;

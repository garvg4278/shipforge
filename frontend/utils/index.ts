import { Package } from '@/types';

export const generateOrderId = (): string => {
  const prefix = 'LGX';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generatePackageId = (): string => {
  return `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

export const createEmptyPackage = (): Package => ({
  id: generatePackageId(),
  label: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  declaredValue: '',
});

export const getTotalWeight = (packages: Package[]): number => {
  return packages.reduce((sum, pkg) => {
    const w = parseFloat(pkg.weight) || 0;
    return sum + w;
  }, 0);
};

export const getTotalDeclaredValue = (packages: Package[]): number => {
  return packages.reduce((sum, pkg) => {
    const v = parseFloat(pkg.declaredValue) || 0;
    return sum + v;
  }, 0);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const validatePincode = (pin: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pin);
};

export const validateForm = (data: import('@/types').OrderFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.shipmentDate) errors.shipmentDate = 'Shipment date is required';

  if (!data.consignor.name.trim()) errors['consignor.name'] = 'Sender name is required';
  if (!data.consignor.address.trim()) errors['consignor.address'] = 'Sender address is required';
  if (!data.consignor.city.trim()) errors['consignor.city'] = 'Sender city is required';
  if (!data.consignor.pincode.trim()) errors['consignor.pincode'] = 'Pincode is required';
  else if (!validatePincode(data.consignor.pincode)) errors['consignor.pincode'] = 'Invalid pincode';

  if (!data.consignee.name.trim()) errors['consignee.name'] = 'Receiver name is required';
  if (!data.consignee.address.trim()) errors['consignee.address'] = 'Receiver address is required';
  if (!data.consignee.city.trim()) errors['consignee.city'] = 'Receiver city is required';
  if (!data.consignee.pincode.trim()) errors['consignee.pincode'] = 'Pincode is required';
  else if (!validatePincode(data.consignee.pincode)) errors['consignee.pincode'] = 'Invalid pincode';

  data.packages.forEach((pkg, i) => {
    if (!pkg.label.trim()) errors[`packages.${i}.label`] = 'Package label is required';
    if (!pkg.weight || parseFloat(pkg.weight) <= 0) errors[`packages.${i}.weight`] = 'Valid weight required';
    if (!pkg.length || parseFloat(pkg.length) <= 0) errors[`packages.${i}.length`] = 'Required';
    if (!pkg.width || parseFloat(pkg.width) <= 0) errors[`packages.${i}.width`] = 'Required';
    if (!pkg.height || parseFloat(pkg.height) <= 0) errors[`packages.${i}.height`] = 'Required';
    if (!pkg.declaredValue || parseFloat(pkg.declaredValue) < 0) errors[`packages.${i}.declaredValue`] = 'Required';
  });

  return errors;
};

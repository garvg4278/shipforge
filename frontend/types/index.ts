export interface Package {
  id: string;
  label: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  declaredValue: string;
}

export interface Address {
  name: string;
  address: string;
  city: string;
  pincode: string;
}

export interface OrderFormData {
  orderId: string;
  shipmentDate: string;
  deliveryType: 'standard' | 'express';
  consignor: Address;
  consignee: Address;
  packages: Package[];
  fragile: boolean;
  insurance: boolean;
}

export type DeliveryType = 'standard' | 'express';

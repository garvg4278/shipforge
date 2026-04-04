'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useShipments } from '@/hooks/useShipments';
import { Shipment, CreateShipmentPayload } from '@/lib/api';
import { OrderFormData, Package } from '@/types';
import { generateOrderId, createEmptyPackage } from '@/utils';
import OrderForm from '@/components/OrderForm/OrderForm';
import LivePreview from '@/components/LivePreview/LivePreview';
import ShipmentList from '@/components/ShipmentList/ShipmentList';
import styles from './page.module.css';

const SSR_INITIAL: OrderFormData = {
  orderId: '', shipmentDate: '', deliveryType: 'standard',
  consignor: { name: '', address: '', city: '', pincode: '' },
  consignee: { name: '', address: '', city: '', pincode: '' },
  packages: [{ id: 'pkg_initial', label: '', weight: '', length: '', width: '', height: '', declaredValue: '' }],
  fragile: false, insurance: false,
};

const buildFreshOrder = (): OrderFormData => ({
  orderId: generateOrderId(),
  shipmentDate: new Date().toISOString().split('T')[0],
  deliveryType: 'standard',
  consignor: { name: '', address: '', city: '', pincode: '' },
  consignee: { name: '', address: '', city: '', pincode: '' },
  packages: [createEmptyPackage()],
  fragile: false, insurance: false,
});

type Tab = 'new' | 'list';

export default function DashboardPage() {
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();
  const { shipments, pagination, loading, error, fetchMyShipments, createShipment } = useShipments();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('new');
  const [formData, setFormData] = useState<OrderFormData>(SSR_INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    setFormData(buildFreshOrder());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && tab === 'list') {
      fetchMyShipments({ page: String(page), limit: '10' });
    }
  }, [isAuthenticated, tab, page, fetchMyShipments]);

  const handleFieldChange = useCallback(<K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAddressChange = useCallback((party: 'consignor' | 'consignee', field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [party]: { ...prev[party], [field]: value } }));
  }, []);

  const handlePackageChange = useCallback((id: string, field: keyof Package, value: string) => {
    setFormData((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg) => pkg.id === id ? { ...pkg, [field]: value } : pkg),
    }));
  }, []);

  const handleAddPackage = useCallback(() => {
    setFormData((prev) => ({ ...prev, packages: [...prev.packages, createEmptyPackage()] }));
  }, []);

  const handleRemovePackage = useCallback((id: string) => {
    setFormData((prev) => {
      if (prev.packages.length <= 1) return prev;
      return { ...prev, packages: prev.packages.filter((p) => p.id !== id) };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitError('');
    try {
      const payload: CreateShipmentPayload = {
        shipmentDate: formData.shipmentDate,
        deliveryType: formData.deliveryType.toUpperCase() as 'STANDARD' | 'EXPRESS',
        fragile: formData.fragile,
        insured: formData.insurance,
        sender: formData.consignor,
        receiver: formData.consignee,
        packages: formData.packages.map((p) => ({
          name: p.label, weight: p.weight, length: p.length,
          width: p.width, height: p.height, declaredValue: p.declaredValue,
        })),
      };
      await createShipment(payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create shipment');
    }
  }, [formData, createShipment]);

  const handleReset = useCallback(() => {
    setFormData(buildFreshOrder());
    setSubmitted(false);
    setSubmitError('');
  }, []);

  if (authLoading || !hydrated) {
    return <div className={styles.loadingPage}><div className={styles.spinner} /></div>;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🚚</span>
            <span className={styles.brandName}>ShipForge</span>
          </div>
          <nav className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'new' ? styles.tabActive : ''}`}
              onClick={() => setTab('new')}
            >
              New Order
            </button>
            <button
              className={`${styles.tab} ${tab === 'list' ? styles.tabActive : ''}`}
              onClick={() => setTab('list')}
            >
              My Shipments
            </button>
          </nav>
          <div className={styles.userArea}>
            <span className={styles.userName}>👤 {user?.name}</span>
            <button className={styles.logoutBtn} onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Body */}
      {tab === 'new' ? (
        <main className={styles.workspace}>
          {submitError && (
            <div className={styles.submitError} role="alert">{submitError}</div>
          )}
          <div className={styles.formPanel}>
            <OrderForm
              data={formData}
              onFieldChange={handleFieldChange}
              onAddressChange={handleAddressChange}
              onPackageChange={handlePackageChange}
              onAddPackage={handleAddPackage}
              onRemovePackage={handleRemovePackage}
              onSubmit={handleSubmit}
              onReset={handleReset}
              submitted={submitted}
            />
          </div>
          <div className={styles.previewPanel}>
            <LivePreview data={formData} />
          </div>
        </main>
      ) : (
        <main className={styles.listView}>
          <ShipmentList
            shipments={shipments}
            pagination={pagination}
            loading={loading}
            error={error}
            page={page}
            onPageChange={setPage}
            isAdmin={false}
          />
        </main>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useShipments } from '@/hooks/useShipments';
import { adminApi, ApiError } from '@/lib/api';
import ShipmentList from '@/components/ShipmentList/ShipmentList';
import styles from './page.module.css';

export default function AdminPage() {
  const { user, logout, loading: authLoading, isAuthenticated, isAdmin } = useAuth();
  const { shipments, pagination, loading, error, fetchAllShipments, updateStatus, deleteShipment } = useShipments();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const doFetch = useCallback(() => {
    const params: Record<string, string> = { page: String(page), limit: '15' };
    if (statusFilter) params.status = statusFilter;
    if (deliveryFilter) params.deliveryType = deliveryFilter;
    if (search) params.search = search;
    fetchAllShipments(params);
  }, [page, statusFilter, deliveryFilter, search, fetchAllShipments]);

  useEffect(() => {
    if (isAdmin) doFetch();
  }, [isAdmin, doFetch]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleFilterChange = useCallback((type: 'status' | 'delivery', val: string) => {
    setPage(1);
    if (type === 'status') setStatusFilter(val);
    else setDeliveryFilter(val);
  }, []);

  const handlePageChange = useCallback((p: number) => setPage(p), []);

  const handleCreateAdmin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');
    setAdminLoading(true);
    try {
      const created = await adminApi.createAdmin(adminForm);
      setAdminSuccess(`Admin account created: ${created.email}`);
      setAdminForm({ name: '', email: '', password: '' });
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Failed to create admin');
    } finally {
      setAdminLoading(false);
    }
  }, [adminForm]);

  if (authLoading) {
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
            <span className={styles.adminBadge}>Admin</span>
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.actionBtn} ${showCreateAdmin ? styles.actionBtnActive : ''}`}
              onClick={() => { setShowCreateAdmin((v) => !v); setAdminError(''); setAdminSuccess(''); }}
            >
              ➕ Create Admin
            </button>
            <span className={styles.userName}>👤 {user?.name}</span>
            <button className={styles.logoutBtn} onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Create Admin Panel */}
        {showCreateAdmin && (
          <div className={styles.createAdminPanel}>
            <h3 className={styles.panelTitle}>Create New Admin</h3>
            {adminError && <div className={styles.errorBanner}>{adminError}</div>}
            {adminSuccess && <div className={styles.successBanner}>{adminSuccess}</div>}
            <form className={styles.adminForm} onSubmit={handleCreateAdmin}>
              <input
                className={styles.adminInput}
                type="text"
                placeholder="Full name"
                value={adminForm.name}
                onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className={styles.adminInput}
                type="email"
                placeholder="Email address"
                value={adminForm.email}
                onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <input
                className={styles.adminInput}
                type="password"
                placeholder="Password (min 8 chars, upper+number)"
                value={adminForm.password}
                onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <button type="submit" className={styles.adminSubmitBtn} disabled={adminLoading}>
                {adminLoading ? 'Creating…' : 'Create Admin'}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filtersBar}>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by order ID, name, or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn}>Search</button>
            {search && (
              <button type="button" className={styles.clearBtn} onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
                Clear
              </button>
            )}
          </form>

          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              className={styles.filterSelect}
              value={deliveryFilter}
              onChange={(e) => handleFilterChange('delivery', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="STANDARD">Standard</option>
              <option value="EXPRESS">Express</option>
            </select>
          </div>
        </div>

        {/* Shipment list */}
        <ShipmentList
          shipments={shipments}
          pagination={pagination}
          loading={loading}
          error={error}
          page={page}
          onPageChange={handlePageChange}
          isAdmin={true}
          onStatusUpdate={async (id, status) => { await updateStatus(id, status); }}
          onDelete={deleteShipment}
        />
      </main>
    </div>
  );
}

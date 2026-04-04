'use client';

import { memo, useState, useCallback } from 'react';
import { Shipment, PaginatedResponse } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './ShipmentList.module.css';

const STATUSES = ['PENDING','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];

interface ShipmentListProps {
  shipments: Shipment[];
  pagination: PaginatedResponse<Shipment>['pagination'] | null;
  loading: boolean;
  error: string | null;
  page: number;
  onPageChange: (p: number) => void;
  isAdmin?: boolean;
  onStatusUpdate?: (id: string, status: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const ShipmentList = memo(function ShipmentList({
  shipments, pagination, loading, error, page,
  onPageChange, isAdmin = false, onStatusUpdate, onDelete,
}: ShipmentListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    if (!onStatusUpdate) return;
    setUpdatingId(id);
    try { await onStatusUpdate(id, status); }
    finally { setUpdatingId(null); }
  }, [onStatusUpdate]);

  const handleDelete = useCallback(async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } finally { setDeletingId(null); }
  }, [onDelete]);

  if (loading) {
    return (
      <div className={styles.stateBox}>
        <div className={styles.spinner} />
        <p className={styles.stateMsg}>Loading shipments…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateBox}>
        <span className={styles.stateIcon}>⚠️</span>
        <p className={styles.stateMsg}>{error}</p>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📦</span>
        <h3 className={styles.emptyTitle}>No shipments yet</h3>
        <p className={styles.emptyMsg}>
          {isAdmin ? 'No shipments found in the system.' : 'Create your first shipment using the "New Order" tab.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>
          {isAdmin ? 'All Shipments' : 'My Shipments'}
          {pagination && (
            <span className={styles.totalCount}>{pagination.total} total</span>
          )}
        </h2>
      </div>

      <div className={styles.list}>
        {shipments.map((shipment) => {
          const isExpanded = expandedId === shipment.id;
          const sender = shipment.sender || shipment.addresses?.find((a) => a.type === 'SENDER');
          const receiver = shipment.receiver || shipment.addresses?.find((a) => a.type === 'RECEIVER');

          return (
            <div key={shipment.id} className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''}`}>
              {/* Card header — always visible */}
              <div
                className={styles.cardHeader}
                onClick={() => setExpandedId(isExpanded ? null : shipment.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedId(isExpanded ? null : shipment.id)}
                aria-expanded={isExpanded}
              >
                <div className={styles.cardLeft}>
                  <code className={styles.orderId}>{shipment.orderId}</code>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.deliveryBadge} ${shipment.deliveryType === 'EXPRESS' ? styles.express : styles.standard}`}>
                      {shipment.deliveryType === 'EXPRESS' ? '⚡ Express' : '📦 Standard'}
                    </span>
                    <StatusBadge status={shipment.status} size="sm" />
                    {shipment.fragile && <span className={styles.flagBadge} style={{ color: '#a855f7', borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.1)' }}>🔮 Fragile</span>}
                    {shipment.insured && <span className={styles.flagBadge} style={{ color: '#06b6d4', borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)' }}>🛡 Insured</span>}
                  </div>
                </div>
                <div className={styles.cardRight}>
                  {isAdmin && shipment.user && (
                    <span className={styles.userInfo}>👤 {shipment.user.name}</span>
                  )}
                  <span className={styles.cardDate}>{formatDate(shipment.createdAt)}</span>
                  <span className={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Card summary row */}
              <div className={styles.cardSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Packages</span>
                  <span className={styles.summaryValue}>{shipment.totalPackages}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Weight</span>
                  <span className={styles.summaryValue}>{shipment.totalWeight} kg</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Declared Value</span>
                  <span className={styles.summaryValue}>{formatCurrency(shipment.totalDeclaredValue)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Ship Date</span>
                  <span className={styles.summaryValue}>{formatDate(shipment.shipmentDate)}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className={styles.cardDetail}>
                  <div className={styles.routeRow}>
                    <div className={styles.routeParty}>
                      <span className={styles.routeTag}>FROM</span>
                      <strong className={styles.routeName}>{sender?.name || '—'}</strong>
                      <span className={styles.routeAddr}>
                        {[sender?.address, sender?.city, sender?.pincode].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                    <span className={styles.routeArrow}>→</span>
                    <div className={styles.routeParty}>
                      <span className={`${styles.routeTag} ${styles.routeTagTo}`}>TO</span>
                      <strong className={styles.routeName}>{receiver?.name || '—'}</strong>
                      <span className={styles.routeAddr}>
                        {[receiver?.address, receiver?.city, receiver?.pincode].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                  </div>

                  {shipment.packages && shipment.packages.length > 0 && (
                    <div className={styles.pkgSection}>
                      <p className={styles.pkgTitle}>Packages ({shipment.packages.length})</p>
                      <div className={styles.pkgGrid}>
                        {shipment.packages.map((pkg, i) => (
                          <div key={pkg.id} className={styles.pkgRow}>
                            <span className={styles.pkgIdx}>{i + 1}</span>
                            <span className={styles.pkgName}>{pkg.name}</span>
                            <span className={styles.pkgDim}>{pkg.length}×{pkg.width}×{pkg.height} cm</span>
                            <span className={styles.pkgWeight}>{pkg.weight} kg</span>
                            <span className={styles.pkgVal}>{formatCurrency(pkg.declaredValue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className={styles.adminControls}>
                      <div className={styles.statusControl}>
                        <label className={styles.statusLabel}>Update Status</label>
                        <div className={styles.statusRow}>
                          <select
                            className={styles.statusSelect}
                            defaultValue={shipment.status}
                            disabled={updatingId === shipment.id}
                            onChange={(e) => handleStatusChange(shipment.id, e.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                          {updatingId === shipment.id && <span className={styles.miniSpinner} />}
                        </div>
                      </div>

                      {confirmDeleteId === shipment.id ? (
                        <div className={styles.confirmDelete}>
                          <span className={styles.confirmMsg}>Delete this shipment?</span>
                          <button
                            className={styles.confirmYes}
                            onClick={() => handleDelete(shipment.id)}
                            disabled={deletingId === shipment.id}
                          >
                            {deletingId === shipment.id ? '…' : 'Yes, Delete'}
                          </button>
                          <button className={styles.confirmNo} onClick={() => setConfirmDeleteId(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setConfirmDeleteId(shipment.id)}
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={!pagination.hasPrev}
            onClick={() => onPageChange(page - 1)}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={!pagination.hasNext}
            onClick={() => onPageChange(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
});

export default ShipmentList;

'use client';

import { memo, useMemo } from 'react';
import { OrderFormData } from '@/types';
import {
  getTotalWeight,
  getTotalDeclaredValue,
  formatCurrency,
  formatDate,
} from '@/utils';
import styles from './LivePreview.module.css';

interface LivePreviewProps {
  data: OrderFormData;
}

const LivePreview = memo(function LivePreview({ data }: LivePreviewProps) {
  const totalWeight = useMemo(() => getTotalWeight(data.packages), [data.packages]);
  const totalValue = useMemo(() => getTotalDeclaredValue(data.packages), [data.packages]);

  const hasConsignorName = data.consignor.name.trim().length > 0;
  const hasConsigneeName = data.consignee.name.trim().length > 0;

  return (
    <div className={styles.container}>
      {/* Preview Header */}
      <div className={styles.previewHeader}>
        <div className={styles.previewHeaderTop}>
          <div className={styles.previewBrand}>
            <span className={styles.previewBrandDot} aria-hidden="true" />
            <span className={styles.previewBrandName}>Shipment Summary</span>
          </div>
          <div className={styles.liveIndicator} aria-label="Live preview active">
            <span className={styles.liveDot} aria-hidden="true" />
            <span>Live</span>
          </div>
        </div>
        <div className={styles.orderIdRow}>
          <code className={styles.previewOrderId}>{data.orderId}</code>
          <span
            className={`${styles.deliveryBadge} ${
              data.deliveryType === 'express' ? styles.express : styles.standard
            }`}
          >
            {data.deliveryType === 'express' ? '⚡ Express' : '📦 Standard'}
          </span>
        </div>
        <p className={styles.shipmentDate}>
          {data.shipmentDate ? (
            <>Scheduled: <strong>{formatDate(data.shipmentDate)}</strong></>
          ) : (
            <span className={styles.emptyHint}>No date selected</span>
          )}
        </p>
      </div>

      {/* Indicators */}
      {(data.fragile || data.insurance) && (
        <div className={styles.indicators}>
          {data.fragile && (
            <span className={styles.indicatorFragile}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1l1.5 3.5H11L8.5 6.5 9.5 10 6 8 2.5 10l1-3.5L1 4.5h3.5z" fill="currentColor"/>
              </svg>
              Fragile
            </span>
          )}
          {data.insurance && (
            <span className={styles.indicatorInsured}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1L1.5 3v3.5c0 2.5 2 4.5 4.5 5 2.5-.5 4.5-2.5 4.5-5V3L6 1z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M4 6l1.5 1.5L8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Insured
            </span>
          )}
        </div>
      )}

      {/* Route */}
      <div className={styles.routeSection}>
        <div className={styles.routeCard}>
          <div className={styles.routeParty}>
            <span className={styles.routePartyTag}>FROM</span>
            {hasConsignorName ? (
              <>
                <p className={styles.routeName}>{data.consignor.name}</p>
                <p className={styles.routeAddress}>
                  {[data.consignor.address, data.consignor.city, data.consignor.pincode]
                    .filter(Boolean)
                    .join(', ') || <span className={styles.emptyHint}>Address not filled</span>}
                </p>
              </>
            ) : (
              <p className={styles.emptyHint}>Sender details not filled</p>
            )}
          </div>

          <div className={styles.routeArrow} aria-hidden="true">
            <div className={styles.routeLine} />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={styles.routeArrowIcon}>
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 10h6M10 7l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.routeLine} />
          </div>

          <div className={styles.routeParty}>
            <span className={styles.routePartyTag} data-direction="to">TO</span>
            {hasConsigneeName ? (
              <>
                <p className={styles.routeName}>{data.consignee.name}</p>
                <p className={styles.routeAddress}>
                  {[data.consignee.address, data.consignee.city, data.consignee.pincode]
                    .filter(Boolean)
                    .join(', ') || <span className={styles.emptyHint}>Address not filled</span>}
                </p>
              </>
            ) : (
              <p className={styles.emptyHint}>Receiver details not filled</p>
            )}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{data.packages.length}</span>
          <span className={styles.statLabel}>Packages</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalWeight > 0 ? `${totalWeight.toFixed(2)}` : '—'}</span>
          <span className={styles.statLabel}>Total Weight (kg)</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWide}`}>
          <span className={styles.statValue}>{totalValue > 0 ? formatCurrency(totalValue) : '—'}</span>
          <span className={styles.statLabel}>Declared Value</span>
        </div>
      </div>

      {/* Package List */}
      <div className={styles.packagesSection}>
        <h3 className={styles.packagesSectionTitle}>
          Package Details
          <span className={styles.packageCount}>{data.packages.length}</span>
        </h3>
        <div className={styles.packagesList}>
          {data.packages.map((pkg, index) => {
            const hasData = pkg.label || pkg.weight;
            return (
              <div key={pkg.id} className={styles.packageRow}>
                <div className={styles.packageRowLeft}>
                  <span className={styles.packageIndex}>{index + 1}</span>
                  <div className={styles.packageInfo}>
                    <span className={styles.packageRowLabel}>
                      {pkg.label || <span className={styles.emptyHint}>Unnamed package</span>}
                    </span>
                    {hasData && (
                      <span className={styles.packageRowDimensions}>
                        {pkg.length && pkg.width && pkg.height
                          ? `${pkg.length} × ${pkg.width} × ${pkg.height} cm`
                          : 'Dimensions not set'}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.packageRowRight}>
                  {pkg.weight && (
                    <span className={styles.packageWeight}>{pkg.weight} kg</span>
                  )}
                  {pkg.declaredValue && (
                    <span className={styles.packageValue}>
                      {formatCurrency(parseFloat(pkg.declaredValue) || 0)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.previewFooter}>
        <p className={styles.footerNote}>
          This preview updates in real time as you fill the form
        </p>
      </div>
    </div>
  );
});

export default LivePreview;

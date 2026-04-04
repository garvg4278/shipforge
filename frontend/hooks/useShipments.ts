'use client';

import { useState, useCallback } from 'react';
import { shipmentApi, adminApi, Shipment, PaginatedResponse, CreateShipmentPayload } from '@/lib/api';

export const useShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Shipment>['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyShipments = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await shipmentApi.getAll(params);
      setShipments(res.items);
      setPagination(res.pagination);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllShipments = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAllShipments(params);
      setShipments(res.items);
      setPagination(res.pagination);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, []);

  const createShipment = useCallback(async (payload: CreateShipmentPayload): Promise<Shipment> => {
    const shipment = await shipmentApi.create(payload);
    setShipments((prev) => [shipment, ...prev]);
    return shipment;
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    const updated = await adminApi.updateStatus(id, status);
    setShipments((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const deleteShipment = useCallback(async (id: string) => {
    await adminApi.deleteShipment(id);
    setShipments((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    shipments, pagination, loading, error,
    fetchMyShipments, fetchAllShipments,
    createShipment, updateStatus, deleteShipment,
  };
};

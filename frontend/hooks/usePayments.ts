'use client';
import { useState, useCallback } from 'react';
import api from '@/lib/axios';
import type { Payment, CreatePaymentRequest, PaymentFilterParams, PagedResponse, ApiResponse } from '@/types';
import { generateIdempotencyKey } from '@/lib/utils';

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPayments = useCallback(async (params: PaymentFilterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<Payment>>>('/v1/payments', { params });
      return data.data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load payments';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPayment = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Payment>>(`/v1/payments/${id}`);
      return data.data;
    } catch (err) {
      setError('Failed to load payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (request: CreatePaymentRequest) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...request, idempotencyKey: request.idempotencyKey || generateIdempotencyKey() };
      const { data } = await api.post<ApiResponse<Payment>>('/v1/payments', payload);
      return data.data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Payment failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refundPayment = useCallback(async (paymentId: string, amount?: number, reason?: string) => {
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<unknown>>(`/v1/payments/${paymentId}/refund`, { amount, reason });
      return data.data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Refund failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, getPayments, getPayment, createPayment, refundPayment };
};

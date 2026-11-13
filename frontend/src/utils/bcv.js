import { useCallback, useEffect, useState } from 'react';
import api from './api';

let cachedBcv = null;
let cachedAt = 0;
let inFlightPromise = null;

const CLIENT_TTL_MS = 5 * 60 * 1000;

export function formatBs(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 'Bs. 0,00';
  return `Bs. ${num.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatRate(rate) {
  const num = Number(rate || 0);
  if (!Number.isFinite(num) || num <= 0) return '0,00';
  return num.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function formatPlainDecimal(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
}

export function formatBcvDate(fechaStr) {
  if (!fechaStr) return new Date().toLocaleDateString('es-VE');
  const clean = String(fechaStr).slice(0, 10);
  const [y, m, d] = clean.split('-');
  if (!y || !m || !d) return clean;
  return `${d}/${m}/${y}`;
}

export async function fetchBcvRate(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedBcv && now - cachedAt < CLIENT_TTL_MS) {
    return cachedBcv;
  }

  if (!forceRefresh && inFlightPromise) {
    return inFlightPromise;
  }

  const reqPromise = api
    .get('/public/bcv-rate', { params: forceRefresh ? { refresh: '1' } : {} })
    .then((res) => {
      cachedBcv = res.data;
      cachedAt = Date.now();
      return cachedBcv;
    })
    .finally(() => {
      if (inFlightPromise === reqPromise) {
        inFlightPromise = null;
      }
    });

  inFlightPromise = reqPromise;
  return reqPromise;
}

export function useBcvRate(initialData = null) {
  const [bcv, setBcv] = useState(initialData || cachedBcv);
  const [loading, setLoading] = useState(!initialData && !cachedBcv);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData && initialData.tasa_bcv) {
      cachedBcv = initialData;
      cachedAt = Date.now();
      setBcv(initialData);
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    let active = true;
    fetchBcvRate(false)
      .then((data) => {
        if (active && data) {
          setBcv(data);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('No se pudo consultar tasa BCV en vivo.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshRate = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const fresh = await fetchBcvRate(true);
      setBcv(fresh);
      return fresh;
    } catch {
      setError('Error actualizando tasa BCV.');
      return null;
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { bcv, loading, refreshing, error, refreshRate };
}

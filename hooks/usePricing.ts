'use client';

import { useState, useEffect, useCallback } from 'react';
import { PricingConfig } from '@/types';
import { getPricingConfig, savePricingConfig, subscribeToStore } from '@/lib/firebase/store';
import { DEFAULT_PRICING_CONFIG } from '@/config/business';

export function usePricing() {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const p = await getPricingConfig();
      setPricing(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeToStore(() => {
      refresh();
    });
    return () => unsub();
  }, [refresh]);

  const updatePricing = async (updated: PricingConfig) => {
    await savePricingConfig(updated);
    setPricing(updated);
  };

  return { pricing, loading, updatePricing, refresh };
}

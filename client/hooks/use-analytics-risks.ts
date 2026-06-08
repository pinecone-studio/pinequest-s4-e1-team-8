"use client";

import { clientApi } from "@/app/lib/client-api";
import type { AnalyticsRisks } from "@/lib/analytics/types";
import { useCallback, useEffect, useState } from "react";

export function useAnalyticsRisks() {
  const [risks, setRisks] = useState<AnalyticsRisks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRisks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await clientApi.get<{ risks: AnalyticsRisks }>(
        "/analytics/risks",
      );
      setRisks(data.risks);
    } catch {
      setError("Could not load risk alerts.");
      setRisks(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRisks();
  }, [fetchRisks]);

  return { risks, isLoading, error, refetch: fetchRisks };
}

"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { clientApi } from "@/app/lib/client-api";

let interceptorId: number | null = null;

export function useClientApiAuth() {
  const { getToken } = useAuth();

  useEffect(() => {
    if (interceptorId !== null) {
      clientApi.interceptors.request.eject(interceptorId);
    }

    interceptorId = clientApi.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // if token fetch fails, proceed without auth header
      }
      return config;
    });

    return () => {
      if (interceptorId !== null) {
        clientApi.interceptors.request.eject(interceptorId);
        interceptorId = null;
      }
    };
  }, [getToken]);
}

"use client";

import { useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyAvailable } from "@/app/providers";

function usePrivyTokenInner(): () => Promise<string | null> {
  const { getAccessToken } = usePrivy();
  return useCallback(async () => {
    try {
      return await getAccessToken();
    } catch {
      return null;
    }
  }, [getAccessToken]);
}

function useNoToken(): () => Promise<string | null> {
  return useCallback(async () => null, []);
}

export function useGetToken(): () => Promise<string | null> {
  const available = usePrivyAvailable();
  if (available) {
    return usePrivyTokenInner();
  }
  return useNoToken();
}

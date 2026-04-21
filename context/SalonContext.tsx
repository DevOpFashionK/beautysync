"use client";

// context/SalonContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface SalonData {
  id: string;
  name: string;
  primaryColor: string;
  logoUrl: string | null;
}

interface SalonContextValue {
  salon: SalonData;
  updateLogoUrl: (url: string | null) => void;
  updatePrimaryColor: (color: string) => void;
  updateName: (name: string) => void;
}

const SalonContext = createContext<SalonContextValue | null>(null);

export function SalonProvider({
  children,
  initialSalon,
}: {
  children: ReactNode;
  initialSalon: SalonData;
}) {
  const [salon, setSalon] = useState<SalonData>(initialSalon);

  const updateLogoUrl = useCallback((url: string | null) => {
    setSalon((prev) => ({ ...prev, logoUrl: url }));
  }, []);

  const updatePrimaryColor = useCallback((color: string) => {
    setSalon((prev) => ({ ...prev, primaryColor: color }));
  }, []);

  const updateName = useCallback((name: string) => {
    setSalon((prev) => ({ ...prev, name }));
  }, []);

  return (
    <SalonContext.Provider value={{ salon, updateLogoUrl, updatePrimaryColor, updateName }}>
      {children}
    </SalonContext.Provider>
  );
}

export function useSalon(): SalonContextValue {
  const ctx = useContext(SalonContext);
  if (!ctx) throw new Error("useSalon must be used within SalonProvider");
  return ctx;
}
"use client";

// context/SalonContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface SalonData {
  id: string;
  name: string;
  primaryColor: string;
  logoUrl: string | null;
}

export interface SubscriptionData {
  plan: string | null;
  status: string | null;
  effectiveStatus: string | null;
}

interface SalonContextValue {
  salon: SalonData;
  subscription: SubscriptionData;
  canCustomizeBrand: boolean; // trialing O (active + pro)
  updateLogoUrl: (url: string | null) => void;
  updatePrimaryColor: (color: string) => void;
  updateName: (name: string) => void;
}

const SalonContext = createContext<SalonContextValue | null>(null);

export function SalonProvider({
  children,
  initialSalon,
  initialSubscription,
}: {
  children: ReactNode;
  initialSalon: SalonData;
  initialSubscription: SubscriptionData;
}) {
  const [salon, setSalon] = useState<SalonData>(initialSalon);

  // La suscripción no cambia durante la sesión — no necesita estado reactivo
  const subscription = initialSubscription;

  const canCustomizeBrand =
    subscription.effectiveStatus === "trialing" ||
    (subscription.effectiveStatus === "active" && subscription.plan === "pro");

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
    <SalonContext.Provider
      value={{
        salon,
        subscription,
        canCustomizeBrand,
        updateLogoUrl,
        updatePrimaryColor,
        updateName,
      }}
    >
      {children}
    </SalonContext.Provider>
  );
}

export function useSalon(): SalonContextValue {
  const ctx = useContext(SalonContext);
  if (!ctx) throw new Error("useSalon must be used within SalonProvider");
  return ctx;
}

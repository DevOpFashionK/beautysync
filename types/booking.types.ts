// types/booking.types.ts

export type BookingStep = "service" | "date" | "time" | "form" | "confirmation";

export interface SlotData {
  time: string;
  available: boolean;
  datetime: string;
}

export interface SlotsResponse {
  slots: SlotData[];
  duration: number;
}

export interface SelectedService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
}

export interface BookingFormData {
  client_name: string;
  client_email?: string;       // opcional — puede no tener email
  client_phone: string;
  client_notes?: string;       // opcional — puede no tener notas
}

export interface BookingPayload {
  salon_id: string;
  service_id: string;
  client_name: string;
  client_email?: string;
  client_phone: string;
  client_notes?: string;
  scheduled_at: string;
}

export interface SalonPublicData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  primary_color: string | null;
  logo_url: string | null;
  is_active: boolean | null;
}

export interface ServicePublicData {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
}
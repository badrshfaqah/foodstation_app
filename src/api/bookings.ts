import { apiClient } from './client';
import type { Booking, Brand, Package, Paginated } from './types';

export type BookingWizardData = {
  brand: Pick<Brand, 'id' | 'name' | 'slug' | 'logo'>;
  package: Package;
  blockedDates: { date: string }[];
  closedPeriods: { starts_at: string; ends_at: string }[];
  weeklyOffDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
  paymentMethods: { value: string; label: string }[];
  bankInfo: {
    bank_name: string;
    account_name: string;
    iban: string;
    account_number: string;
  };
};

export async function getBookings() {
  const { data } = await apiClient.get<{ bookings: Paginated<Booking> }>('/bookings');
  return data.bookings;
}

export async function getBookingWizard(brandSlug: string, packageId: number) {
  const { data } = await apiClient.get<BookingWizardData>(
    `/brands/${brandSlug}/packages/${packageId}/wizard`
  );
  return data;
}

export type CreateBookingPayload = {
  package_id: number;
  persons_count: number;
  event_date: string;
  event_time: string;
  extra_hours?: number;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  contact_phone: string;
  notes?: string;
  payment_method: string;
  selected_addons?: { name: string; price: number; pricing: 'fixed' | 'per_person' }[];
  staff_gender_preference?: 'mixed' | 'male' | 'female';
};

export async function createBooking(payload: CreateBookingPayload) {
  const { data } = await apiClient.post<{ booking: Booking }>('/bookings', payload);
  return data.booking;
}

export async function getBooking(id: number) {
  const { data } = await apiClient.get<{ booking: Booking }>(`/bookings/${id}`);
  return data.booking;
}

export async function cancelBooking(id: number) {
  await apiClient.post(`/bookings/${id}/cancel`);
}

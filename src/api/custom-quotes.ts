import { apiClient } from './client';
import type { Booking, CustomerQuote, Paginated } from './types';

export async function getCustomerQuotes() {
  const { data } = await apiClient.get<{ quotes: Paginated<CustomerQuote> }>('/custom-quotes');
  return data.quotes;
}

export async function getCustomerQuote(id: number) {
  const { data } = await apiClient.get<{ quote: CustomerQuote }>(`/custom-quotes/${id}`);
  return data.quote;
}

export type CreateCustomerQuotePayload = {
  brand_id: number;
  event_type: string;
  event_date: string;
  event_time: string;
  city: string;
  location_address: string;
  expected_guests: number;
  budget_min?: number;
  budget_max?: number;
  service_types: string[];
  details?: string;
  contact_phone: string;
};

export async function createCustomerQuote(payload: CreateCustomerQuotePayload) {
  const { data } = await apiClient.post<{ quote: CustomerQuote }>('/custom-quotes', payload);
  return data.quote;
}

export async function acceptCustomerQuote(id: number, paymentMethod: 'electronic' | 'bank_transfer') {
  const { data } = await apiClient.post<{ booking: Booking }>(`/custom-quotes/${id}/accept`, {
    payment_method: paymentMethod,
  });
  return data.booking;
}

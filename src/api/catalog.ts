import { apiClient } from './client';
import type { Brand, Package, PackageOffer, Paginated } from './types';

export type BrandFilters = {
  city?: string;
  service_type?: string;
  search?: string;
};

export type ServiceTypeOption = { id?: number; value: string; label: string; image?: string | null };
export type CityOption = { value: string; label: string };

export async function getOffers(filters: { city?: string; service_type?: string } = {}) {
  const { data } = await apiClient.get<{ offers: PackageOffer[] }>('/offers', { params: filters });
  return data.offers;
}

export async function getBrands(filters: BrandFilters = {}) {
  const { data } = await apiClient.get<{
    brands: Paginated<Brand>;
    serviceTypes: ServiceTypeOption[];
    cities: CityOption[];
  }>('/brands', { params: filters });
  return data;
}

export async function getBrand(slug: string) {
  const { data } = await apiClient.get<{ brand: Brand; bookingAvailable: boolean; minPrice: number | null }>(
    `/brands/${slug}`
  );
  return data;
}

export async function getPackage(brandSlug: string, packageId: number) {
  const { data } = await apiClient.get<{ brand: Brand; package: Package; bookingAvailable: boolean }>(
    `/brands/${brandSlug}/packages/${packageId}`
  );
  return data;
}

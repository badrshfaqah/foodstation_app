export type UserRole = 'customer' | 'brand_owner' | 'staff' | 'accountant' | 'cs' | 'executive' | 'admin';

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
};

export type Package = {
  id: number;
  brand_id: number;
  name: string;
  description: string | null;
  images: string[] | null;
  price: number;
  min_persons: number;
  persons_count: number;
  max_persons: number | null;
  allow_extra_persons: boolean;
  extra_person_price: number | null;
  allow_extra_hours: boolean;
  extra_hour_price: number | null;
  max_extra_hours: number | null;
  duration_hours: number;
  min_booking_hours: number;
  service_type: string | null;
  requirements: string[] | null;
  includes: string[] | null;
  selection_groups: { label: string; min: number; max: number; options: string[] }[] | null;
  optional_addons: { name: string; price: number; pricing: 'fixed' | 'per_person' }[] | null;
  is_active: boolean;
  sort_order: number;
};

export type Brand = {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  description: string | null;
  service_type: string | null;
  service_types?: string[] | null;
  city: string;
  cities?: string[] | null;
  logo: string | null;
  cover: string | null;
  images: string[] | null;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_available: boolean;
  effective_available?: boolean;
  weekly_off_days?: number[] | null;
  working_hours_start?: string;
  working_hours_end?: string;
  packages?: Package[];
  active_packages?: Package[];
};

export type PackageOffer = {
  id: number;
  package_id: number;
  brand_id: number;
  name: string;
  original_price: number;
  offer_price: number;
  brand?: Pick<Brand, 'id' | 'name' | 'slug' | 'logo' | 'city' | 'rating' | 'reviews_count' | 'service_type'>;
  package?: Pick<Package, 'id' | 'name' | 'description' | 'persons_count' | 'duration_hours' | 'service_type'>;
};

export type BookingStatus =
  | 'pending_payment'
  | 'pending_brand'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type Booking = {
  id: number;
  booking_number: string;
  status: BookingStatus;
  event_date: string;
  event_time: string;
  persons_count: number;
  total_amount: number;
  payment_method: string;
  location_address: string;
  brand?: Pick<Brand, 'id' | 'name' | 'slug' | 'logo' | 'service_type' | 'city'>;
  package?: Pick<Package, 'id' | 'name' | 'price'>;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type AppNotification = {
  id: string;
  data: {
    type?: string;
    icon?: string;
    title?: string;
    body?: string;
    url?: string;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
};

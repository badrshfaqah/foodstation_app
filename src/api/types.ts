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
  staff_total: number;
  staff_male: number;
  staff_female: number;
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
  extra_hours: number;
  total_amount: number;
  payment_method: string;
  payment_deadline: string | null;
  location_address: string;
  contact_phone: string | null;
  selection_choices: Record<string, string[]> | null;
  selected_addons: { name: string; price: number; pricing: 'fixed' | 'per_person' }[] | null;
  staff_gender_preference: 'mixed' | 'male' | 'female' | null;
  notes: string | null;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  can_cancel: boolean;
  can_review: boolean;
  can_upload_receipt: boolean;
  payment: {
    method: string;
    status: string;
    receipt_uploaded: boolean;
    rejection_reason: string | null;
  } | null;
  review: {
    service_quality: number;
    food_quality: number;
    punctuality: number;
    hospitality: number;
    overall_rating: number;
    comment: string | null;
  } | null;
  brand?: Pick<Brand, 'id' | 'name' | 'slug' | 'logo' | 'service_type' | 'city'>;
  package?: Pick<Package, 'id' | 'name' | 'price'>;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type CustomerQuoteOffer = {
  id: number;
  amount: number;
  duration_hours: number;
  persons_count: number;
  includes: string[] | null;
  terms: string | null;
  expires_at: string;
  status: 'pending_customer' | 'accepted' | 'declined' | 'withdrawn';
  booking_id: number | null;
  package?: { id: number; name: string };
};

export type CustomerQuote = {
  id: number;
  request_number: string;
  event_type: string;
  event_date: string;
  event_time: string;
  city: string;
  location_address: string;
  expected_guests: number;
  budget_min: number | null;
  budget_max: number | null;
  service_types: string[];
  details: string | null;
  contact_phone: string;
  status: 'pending_provider' | 'offered' | 'accepted' | 'cancelled';
  brand?: Pick<Brand, 'id' | 'name' | 'slug' | 'logo'>;
  offer: CustomerQuoteOffer | null;
  created_at: string | null;
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

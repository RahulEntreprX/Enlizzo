
export interface User {
  id: string;
  name: string;
  email: string;
  hostel: string;
  avatarUrl: string;
  phone?: string;
  year?: string;
  bio?: string;
  role?: 'USER' | 'ADMIN';
  isBanned?: boolean;
  deletionRequestedAt?: string | null;
  theme?: 'dark' | 'light';
}

export enum Category {
  Electronics = 'Electronics',
  Books = 'Books',
  Cycles = 'Cycles',
  Furniture = 'Furniture',
  Stationery = 'Stationery',
  Clothing = 'Clothing',
  Other = 'Other',
}

export enum Condition {
  New = 'New',
  LikeNew = 'Like New',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
}

export type ListingType = 'STANDARD' | 'FOREVER';

export interface Product {
  id: string;
  title: string;
  price: number; // 0 means free/donation
  originalPrice?: number;
  description: string;
  category: Category;
  condition: Condition;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerHostel: string;
  sellerEmail?: string;
  sellerPhone?: string;
  createdAt: string;
  likes: number;
  isSold: boolean;
  status?: 'ACTIVE' | 'SOLD' | 'ARCHIVED' | 'FLAGGED';
  type?: ListingType;
  expiresAt?: string | null;
}

export interface FilterState {
  search: string;
  category: Category | 'All';
  minPrice: number;
  maxPrice: number;
  hostel: string | 'All';
  donationOnly: boolean;
}

export type ViewState = 'landing' | 'marketplace' | 'product-detail' | 'listing' | 'profile' | 'admin';

export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  createdAt: string;
  listing?: Partial<Product> & { sellerName?: string; sellerEmail?: string };
  reporter?: Partial<User>;
}

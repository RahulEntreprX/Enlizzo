
export interface CampusConfig {
  id: string;
  slug: string; // 'iitd', 'iitk', etc.
  name: string; // 'IIT Delhi'
  emailDomains: string[]; // ['@iitd.ac.in', '@iitd.df.in']
  hostels: string[];
  theme: {
    primary: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  hostel: string;
  avatarUrl: string;
  phone?: string;
  year?: string;
  bio?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR';
  isBanned?: boolean;
  deletionRequestedAt?: string | null;
  theme?: 'dark' | 'light';
  campusId?: string; 
  campusSlug?: string; // Mapped from DB relation
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
  slug: string;
  title: string;
  price: number;
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
  campusId?: string; // New field
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

export interface AdminLog {
    id: string;
    actorId: string;
    actorName: string;
    action: string;
    target: string;
    details?: string;
    timestamp: string;
    type: 'INFO' | 'WARNING' | 'DANGER';
}

export interface SystemSettings {
    priceCapPercentage: number;
    maintenanceMode: boolean;
    allowNewSignups: boolean;
    systemNotice: string;
}
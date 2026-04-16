export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller' | 'customer';
  phone?: string;
  address?: string;
  shopName?: string;
  shopDescription?: string;
  profileImage?: string;
  [key: string]: any;
}

export interface ProductImage {
  id?: number;
  url: string;
}

export interface ProductRating {
  id: number;
  rating: number;
  review?: string;
  userId: string;
  productId: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  categories: string[];
  sellerId: string;
  seller?: User;
  images: ProductImage[];
  availableSizes?: string[];
  availableColors?: string[];
  soldCount: number;
  ratings?: ProductRating[];
  rating?: number;
  reviews?: any[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
  design?: string;
  isSelected: boolean;
}

export interface Address {
  id: string;
  recipientName: string;
  phone: string;
  houseNo?: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  label: 'Home' | 'Work' | 'Other';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Conversation {
  otherUser: {
    id: string;
    name: string;
    shopName?: string;
    profileImage?: string;
    role: string;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

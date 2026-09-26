export type Role = 'MEMBER' | 'ADMIN' | 'HUB_MANAGER' | 'SUPPLIER';

export type PoolStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'FULFILLED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'HELD_IN_ESCROW' | 'DISBURSED' | 'REFUNDED' | 'FAILED';

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'READY_FOR_COLLECTION' | 'COLLECTED' | 'CANCELLED';

export interface UserDto {
  id: string;
  phoneNumber: string;
  fullName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface StokvelGroupDto {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickupHubDto {
  id: string;
  name: string;
  address: string;
  city: string;
  managerId: string;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  retailPrice: number;
  unitQuantity: string;
  imageUrl?: string | null;
}

export interface BuyingPoolDto {
  id: string;
  productId: string;
  hubId: string;
  groupId?: string | null;
  status: PoolStatus;
  targetQuantity: number;
  currentQuantity: number;
  targetAmount: number;
  currentAmount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  product?: ProductDto;
  hub?: PickupHubDto;
  group?: StokvelGroupDto | null;
}

export interface OrderDto {
  id: string;
  userId: string;
  poolId: string;
  hubId: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  collectionOtp?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: UserDto;
  pool?: BuyingPoolDto;
  hub?: PickupHubDto;
  escrow?: EscrowTransactionDto | null;
}

export interface EscrowTransactionDto {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  providerRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

// API DTOs
export interface RequestOtpRequest {
  phoneNumber: string;
}

export interface RequestOtpResponse {
  message: string;
  debugOtp?: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: UserDto;
}

export interface PlaceOrderRequest {
  poolId: string;
  quantity: number;
}

export interface RedeemVoucherRequest {
  collectionOtp: string;
}

export interface PoolProgressSummary {
  currentQty: number;
  targetQty: number;
  unitPrice: number;
  retailPrice: number;
  percentage: number;
  savingsPercentage: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF';
  companyId: string;
  company?: Company;
  permissions?: string[];
  isActive?: boolean;
  avatarUrl?: string;
  phone?: string;
  lastLoginAt?: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  slug: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface CompanySettings {
  id: string;
  companyId: string;
  currency: string;
  currencySymbol: string;
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string;
  invoicePrefix: string;
  lowStockThreshold: number;
  requireApproval: boolean;
  allowStaffDiscount: boolean;
  receiptFooter?: string;
  timezone: string;
  dateFormat: string;
  priceCodeWord?: string | null;
  priceCodeDigits?: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  brand?: string;
  description?: string;
  unit: string;
  categoryId?: string;
  supplierId?: string;
  category?: { id: string; name: string };
  supplier?: { id: string; name: string };
  costPrice: number;
  sellingPrice: number;
  discountEnabled: boolean;
  maxDiscountPercent: number;
  maxDiscountAmount: number;
  currentStock: number;
  openingStock: number;
  reorderLevel: number;
  lowStockThreshold: number;
  shelfNumber?: string;
  shelfRow?: string;
  rackNumber?: string;
  expiryDate?: string;
  batchNumber?: string;
  approvalStatus: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'DISCONTINUED' | 'OUT_OF_STOCK';
  isActive: boolean;
  createdBy?: { id: string; firstName: string; lastName: string };
  approvedBy?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
  creditBalance: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
  maxDiscountPercent: number;
  discountEnabled: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  customerId?: string;
  customer?: Customer;
  createdById: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'CASH' | 'CREDIT';
  status: 'DRAFT' | 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'CANCELLED';
  cashReceived?: number;
  changeGiven?: number;
  profit: number;
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  _count?: { items: number };
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  profit: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'CASH' | 'CREDIT';
  status: 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'CANCELLED';
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  companyId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  period: string;
  sales: number;
  profit: number;
  receivedCash: number;
  pendingCredit: number;
  totalInvoices: number;
  totalCustomers: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingApprovals: number;
  nearExpiry: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

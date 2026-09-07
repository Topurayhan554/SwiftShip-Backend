export interface IDashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalCouriers: number;
  totalParcels: number;
  parcelsByStatus: Record<string, number>;
  totalRevenue: number;
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
}

export interface IAuditLogFilters {
  entityType?: string;
  actorId?: string;
}

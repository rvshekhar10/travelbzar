import { Booking } from '@/types';

export interface AnalyticsSummary {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  activeTrips: number;

  totalRevenue: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;

  todayTrips: number;
  thisWeekTrips: number;
  thisMonthTrips: number;

  recentDailyRevenue: Array<{ date: string; label: string; revenue: number; trips: number }>;
  statusDistribution: Record<string, number>;
}

export function computeAnalytics(bookings: Booking[]): AnalyticsSummary {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalRevenue = 0;
  let todayRevenue = 0;
  let thisWeekRevenue = 0;
  let thisMonthRevenue = 0;

  let todayTrips = 0;
  let thisWeekTrips = 0;
  let thisMonthTrips = 0;
  let completedBookings = 0;
  let pendingBookings = 0;
  let cancelledBookings = 0;
  let activeTrips = 0;

  const statusDistribution: Record<string, number> = {
    PENDING_CONFIRMATION: 0,
    CONFIRMED: 0,
    DRIVER_ASSIGNED: 0,
    DRIVER_EN_ROUTE: 0,
    DRIVER_ARRIVED: 0,
    TRIP_STARTED: 0,
    TRIP_COMPLETED: 0,
    CANCELLED: 0,
    REJECTED: 0,
  };

  // Generate 7 day empty series
  const dailyMap = new Map<string, { revenue: number; trips: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    dailyMap.set(ds, { revenue: 0, trips: 0 });
  }

  bookings.forEach((b) => {
    // Count status
    if (statusDistribution[b.status] !== undefined) {
      statusDistribution[b.status]++;
    }

    if (b.status === 'PENDING_CONFIRMATION') pendingBookings++;
    if (b.status === 'CANCELLED' || b.status === 'REJECTED') cancelledBookings++;
    if (['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(b.status)) activeTrips++;

    if (b.status === 'TRIP_COMPLETED') {
      completedBookings++;
      const fareAmount = b.fare?.totalFare || 0;
      totalRevenue += fareAmount;

      const bookingDateObj = new Date(b.bookingDate);

      // Check today
      if (b.bookingDate === todayStr) {
        todayRevenue += fareAmount;
        todayTrips++;
      }

      // Check this week
      if (bookingDateObj >= oneWeekAgo) {
        thisWeekRevenue += fareAmount;
        thisWeekTrips++;
      }

      // Check this month
      if (bookingDateObj >= startOfMonth) {
        thisMonthRevenue += fareAmount;
        thisMonthTrips++;
      }

      // Daily chart series
      if (dailyMap.has(b.bookingDate)) {
        const item = dailyMap.get(b.bookingDate)!;
        item.revenue += fareAmount;
        item.trips++;
      }
    }
  });

  const recentDailyRevenue = Array.from(dailyMap.entries()).map(([dateStr, data]) => {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
    return {
      date: dateStr,
      label: dayName,
      revenue: data.revenue,
      trips: data.trips,
    };
  });

  return {
    totalBookings: bookings.length,
    completedBookings,
    pendingBookings,
    cancelledBookings,
    activeTrips,
    totalRevenue,
    todayRevenue,
    thisWeekRevenue,
    thisMonthRevenue,
    todayTrips,
    thisWeekTrips,
    thisMonthTrips,
    recentDailyRevenue,
    statusDistribution,
  };
}

/**
 * Exports booking list to downloadable CSV file.
 */
export function exportBookingsToCSV(bookings: Booking[]): void {
  if (typeof window === 'undefined') return;

  const headers = [
    'Booking Number',
    'Date',
    'Time (IST)',
    'Status',
    'Customer Name',
    'Customer Phone',
    'Trip Type',
    'Pickup Address',
    'Drop Address',
    'Driver',
    'Vehicle',
    'Distance (km)',
    'Base Fare (INR)',
    'Total Fare (INR)',
    'Payment Status',
    'Payment Method',
  ];

  const rows = bookings.map((b) => [
    b.bookingNumber,
    b.bookingDate,
    b.pickupTime,
    b.status,
    `"${b.customerName}"`,
    `"${b.customerPhone}"`,
    b.bookingType,
    `"${b.pickup.address.replace(/"/g, '""')}"`,
    `"${b.drop.address.replace(/"/g, '""')}"`,
    `"${b.driverName || 'Unassigned'}"`,
    `"${b.vehicleRegistrationNumber || 'Unassigned'}"`,
    b.distanceKm,
    b.fare?.baseFare || 0,
    b.fare?.totalFare || 0,
    b.paymentStatus,
    b.paymentMethod || 'N/A',
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Travel_BZAR_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

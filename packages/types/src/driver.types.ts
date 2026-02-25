export type DriverStatus = 'offline' | 'available' | 'en_route' | 'on_job' | 'break';

export interface DriverProfile {
  id: string;
  userId: string;
  status: DriverStatus;
  vehicleType: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  licensePlate: string | null;
  currentLat: number | null;
  currentLng: number | null;
  locationUpdatedAt: string | null;
  paypalLink: string | null;
  venmoLink: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  organizationId: string | null;
}

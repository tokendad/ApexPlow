export interface PricingTier {
  id: number;
  tierLabel: string;
  priceCents: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CancellationRule {
  id: number;
  jobType: 'asap' | 'scheduled';
  hoursBeforeThreshold: number | null;
  chargePercent: number;
  description: string;
}

export interface ServiceArea {
  id: string;
  homeBaseAddress: string;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

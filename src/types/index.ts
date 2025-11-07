export type DeliveryStatus = 'Scheduled' | 'In Transit' | 'Cancelled' | 'Completed' | 'Delivered';
export interface Hub {
  id: string;
  name: string;
  location: string;
}
export interface Package {
  id: string;
  trackingId: string;
  sender: string;
  recipient: string;
  origin: string;
  destination: string;
  status: DeliveryStatus;
  currentHub: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface Consignment {
  id: string;
  name: string;
  date: Date;
  originHub: string;
  destinationHub: string;
  currentHub?: string | null;
  routeHubs?: string[]; // Ordered list of hubs in the route
  status: DeliveryStatus;
  packages: Package[];
  activePacketsCount?: number;
  newPackageCount?: number;
  departureTime?: Date;
  arrivalTime?: Date;
  estimatedArrival?: Date;
}
export interface HubEvent {
  consignmentId: string;
  hubId: string;
  eventType: 'arrival' | 'departure';
  timestamp: Date;
}

// Update items returned by tracking API
export interface TrackingUpdate {
  id: number;
  packetId?: number;
  trackingId: string;
  currentHub: string;
  status: string; // raw external status like CREATED, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
  updatedAt: Date;
}
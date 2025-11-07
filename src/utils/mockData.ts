import { Hub, Package, Consignment, DeliveryStatus } from '../types';
export const hubs: Hub[] = [{
  id: 'hub1',
  name: 'North Hub',
  location: 'Downtown District'
}, {
  id: 'hub2',
  name: 'South Hub',
  location: 'Industrial Zone'
}, {
  id: 'hub3',
  name: 'East Hub',
  location: 'Airport Area'
}, {
  id: 'hub4',
  name: 'West Hub',
  location: 'Suburban Center'
}];
export const initialPackages: Package[] = [{
  id: 'pkg1',
  trackingId: 'TRK001234567',
  sender: 'John Smith',
  recipient: 'Alice Johnson',
  origin: 'North Hub',
  destination: 'South Hub',
  status: 'In Transit',
  currentHub: 'North Hub',
  createdAt: new Date('2024-01-15T08:00:00'),
  updatedAt: new Date('2024-01-15T09:30:00')
}, {
  id: 'pkg2',
  trackingId: 'TRK001234568',
  sender: 'Sarah Davis',
  recipient: 'Bob Wilson',
  origin: 'East Hub',
  destination: 'West Hub',
  status: 'Scheduled',
  currentHub: 'East Hub',
  createdAt: new Date('2024-01-15T07:00:00'),
  updatedAt: new Date('2024-01-15T07:00:00')
}, {
  id: 'pkg3',
  trackingId: 'TRK001234569',
  sender: 'Mike Brown',
  recipient: 'Emma Taylor',
  origin: 'South Hub',
  destination: 'North Hub',
  status: 'Completed',
  currentHub: 'North Hub',
  createdAt: new Date('2024-01-14T10:00:00'),
  updatedAt: new Date('2024-01-14T16:00:00')
}];
export const initialConsignments: Consignment[] = [{
  id: 'con1',
  name: 'Morning Route - North to South',
  date: new Date(),
  originHub: 'North Hub',
  destinationHub: 'South Hub',
  status: 'In Transit',
  packages: [initialPackages[0]],
  departureTime: new Date('2024-01-15T09:00:00'),
  estimatedArrival: new Date('2024-01-15T12:00:00')
}, {
  id: 'con2',
  name: 'Afternoon Route - East to West',
  date: new Date(),
  originHub: 'East Hub',
  destinationHub: 'West Hub',
  status: 'Scheduled',
  packages: [initialPackages[1]],
  estimatedArrival: new Date('2024-01-15T15:00:00')
}];
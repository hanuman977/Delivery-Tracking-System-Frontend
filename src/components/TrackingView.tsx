import { PackageIcon, MapPinIcon, ClockIcon, CheckCircleIcon, TruckIcon } from 'lucide-react';
import { Package, TrackingUpdate } from '../types';
interface TrackingViewProps {
  package: Package;
  updates?: TrackingUpdate[];
}
export function TrackingView({
  package: pkg,
  updates
}: TrackingViewProps) {
  // Build route stops from origin, unique intermediate hubs (from updates), and destination
  const getRouteStops = () => {
    const stops: string[] = [pkg.origin];
    if (Array.isArray(updates) && updates.length > 0) {
      const seen = new Set<string>([pkg.origin]);
      // Sort updates chronologically to preserve path order
      const sorted = updates.slice().sort((a, b) => {
        const ta = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
        const tb = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
        return ta - tb;
      });
      for (const u of sorted) {
        const hub = u.currentHub;
        if (!hub) continue;
        if (hub === pkg.origin || hub === pkg.destination) continue;
        if (!seen.has(hub)) {
          stops.push(hub);
          seen.add(hub);
        }
      }
    }
    if (stops[stops.length - 1] !== pkg.destination) {
      stops.push(pkg.destination);
    }
    return stops;
  };
  const routeStops = getRouteStops();
  const getCurrentStopIndex = () => {
    // If completed or at destination, point to the last stop
    if (pkg.status === 'Completed' || pkg.currentHub === pkg.destination) {
      return routeStops.length - 1;
    }
    // Prefer exact match of currentHub among computed stops
    let idx = routeStops.findIndex((s) => s === pkg.currentHub);
    if (idx !== -1) return idx;
    // Fallback: use the hub from the latest update
    if (Array.isArray(updates) && updates.length > 0) {
      const latest = updates.slice().sort((a, b) => {
        const tb = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
        const ta = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
        return tb - ta;
      })[0];
      idx = routeStops.findIndex((s) => s === latest.currentHub);
      if (idx !== -1) return idx;
    }
    // Default to origin
    return 0;
  };
  const currentStopIndex = getCurrentStopIndex();
  const progressPercentage = routeStops.length > 1 ? (currentStopIndex / (routeStops.length - 1)) * 100 : 0;
  const getStatusIcon = () => {
    switch (pkg.status) {
      case 'Scheduled':
        return <ClockIcon className="w-8 h-8" />;
      case 'In Transit':
        return <TruckIcon className="w-8 h-8" />;
      case 'Completed':
        return <CheckCircleIcon className="w-8 h-8" />;
      default:
        return <PackageIcon className="w-8 h-8" />;
    }
  };
  const getStatusColor = () => {
    switch (pkg.status) {
      case 'Scheduled':
        return 'text-yellow-600 bg-yellow-100';
      case 'In Transit':
        return 'text-blue-600 bg-blue-100';
      case 'Completed':
        return 'text-green-600 bg-green-100';
      case 'Cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  return <div className="overflow-hidden bg-white rounded-lg shadow-sm">
      <div className="px-6 py-8 text-white bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">Tracking ID</p>
            <p className="text-2xl font-bold">{pkg.trackingId}</p>
          </div>
          <div className={`p-4 rounded-full ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {pkg.status}
          </span>
        </div>
      </div>
  <div className="p-6">
        <div className="mb-6">
          <h3 className="mb-4 text-sm font-medium text-gray-500">
            Delivery Progress
          </h3>
          <div className="relative">
            {/* Progress bar background */}
            <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full top-6" />
            {/* Active progress */}
            <div className="absolute left-0 h-1 transition-all duration-500 bg-blue-600 rounded-full top-6" style={{
            width: `${progressPercentage}%`
          }} />
            {/* Route stops */}
            <div className="relative flex justify-between">
              {routeStops.map((stop, index) => {
              const isCompleted = index < currentStopIndex || index === currentStopIndex && pkg.status === 'Completed';
              const isCurrent = index === currentStopIndex && pkg.status !== 'Completed';
              const isUpcoming = index > currentStopIndex;
              return <div key={index} className="flex flex-col items-center" style={{
                width: `${100 / (routeStops.length - 1)}%`
              }}>
                    {/* Stop indicator */}
                    <div className="relative z-10 mb-2">
                      {isCompleted && <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full">
                          <CheckCircleIcon className="w-6 h-6 text-white" />
                        </div>}
                      {isCurrent && <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full animate-pulse">
                          <TruckIcon className="w-6 h-6 text-white" />
                        </div>}
                      {isUpcoming && <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
                          <MapPinIcon className="w-6 h-6 text-gray-400" />
                        </div>}
                    </div>
                    {/* Stop label */}
                    <div className="text-center">
                      <p className={`text-xs font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                          {formatHubName(stop)}
                      </p>
                      {isCurrent && <p className="mt-1 text-xs font-semibold text-blue-600">
                          Current Location
                        </p>}
                    </div>
                  </div>;
            })}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">
                Current Location
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
                  {formatHubName(pkg.currentHub)}
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">
                Last Updated
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {pkg.updatedAt.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="pt-6 border-t border-gray-200">
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            Shipment Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Sender</span>
              <span className="text-sm font-medium text-gray-900">
                {pkg.sender}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Recipient</span>
              <span className="text-sm font-medium text-gray-900">
                {pkg.recipient}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Origin</span>
              <span className="text-sm font-medium text-gray-900">
                {pkg.origin}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Destination</span>
              <span className="text-sm font-medium text-gray-900">
                {pkg.destination}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Created</span>
              <span className="text-sm font-medium text-gray-900">
                {pkg.createdAt.toLocaleDateString()}{' '}
                {pkg.createdAt.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        {Array.isArray(updates) && updates.length > 0 && (
          <div className="pt-6 mt-6 border-t border-gray-200">
            <h3 className="mb-3 text-sm font-medium text-gray-900">Updates</h3>
            <div className="space-y-3">
              {updates
                .slice()
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((u) => (
                  <div key={`${u.id}-${u.updatedAt}`} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatExternalStatus(u.status)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {(u.updatedAt instanceof Date ? u.updatedAt : new Date(u.updatedAt)).toLocaleString()} • {formatHubName(u.currentHub)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        {pkg.status === 'In Transit' && <div className="p-4 mt-6 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Your package is on the way!</span>
              <br />
              It will arrive at {pkg.destination} soon.
            </p>
          </div>}
        {pkg.status === 'Completed' && <div className="p-4 mt-6 rounded-lg bg-green-50">
            <p className="text-sm text-green-900">
              <span className="font-medium">Delivery completed!</span>
              <br />
              Your package has been successfully delivered.
            </p>
          </div>}
      </div>
    </div>;
}

function formatHubName(name: string): string {
  if (!name) return name;
  // Replace underscores/dashes with spaces
  let pretty = name.replace(/[_-]+/g, ' ');
  // Insert spaces between camelCase or PascalCase word boundaries
  pretty = pretty.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Collapse multiple spaces
  pretty = pretty.replace(/\s{2,}/g, ' ').trim();
  return pretty;
}

function formatExternalStatus(s: string): string {
  switch (s) {
    case 'CREATED':
      return 'Created';
    case 'ASSIGNED':
      return 'Assigned';
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return s
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
  }
}
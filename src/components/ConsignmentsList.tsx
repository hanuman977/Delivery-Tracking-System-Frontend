import { TruckIcon, PackageIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { Consignment, DeliveryStatus } from '../types';
import { put } from '../utils/api';
import { useState } from 'react';

interface UpdateStatusResponse {
  consignmentId?: number;
  hub?: string;
  status: string;
  message?: string;
}
interface ConsignmentsListProps {
  consignments: Consignment[];
  onUpdateConsignment: (consignment: Consignment) => void;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  selectedHub?: string;
  onRefresh?: () => void;
}
export function ConsignmentsList({
  consignments,
  title,
  subtitle,
  emptyMessage,
  selectedHub,
  onRefresh
}: ConsignmentsListProps) {
  const [loadingConsignmentId, setLoadingConsignmentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Track successful local actions so buttons can disable immediately post-success
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Transit':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'Scheduled':
        return <ClockIcon className="w-4 h-4" />;
      case 'In Transit':
        return <TruckIcon className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircleIcon className="w-4 h-4" />;
    }
  };
  const handleStatusChange = async (consignment: Consignment, actionType: 'ARRIVAL' | 'DEPARTURE') => {
    if (!selectedHub) {
      setErrorMessage('Please select a hub first');
      return;
    }

    setLoadingConsignmentId(consignment.id);
    setErrorMessage(null);

    try {
      const response = await put<UpdateStatusResponse>(
        `/consignment/${consignment.id}/update-status?hubName=${encodeURIComponent(selectedHub)}&status=${actionType}`
      );

      if (response.status === 'OK') {
        // Success - refresh the consignments list
        console.log('Status updated successfully:', response);
        // Record completion locally so the relevant button disables immediately
        const key = `${consignment.id}|${selectedHub}|${actionType}`;
        setCompletedActions(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
        if (onRefresh) {
          onRefresh();
        }
      } else if (response.status === 'BLOCKED') {
        // Show error message
        setErrorMessage(response.message || 'Action blocked');
        setTimeout(() => setErrorMessage(null), 5000); // Clear error after 5 seconds
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update status');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoadingConsignmentId(null);
    }
  };
  return <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {title ?? "Today's Consignments"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {subtitle ?? `Active route trips for ${new Date().toLocaleDateString()}`}
        </p>
        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}
      </div>
      <div className="divide-y divide-gray-200">
        {consignments.map(consignment => <div key={consignment.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">
                  {consignment.name}
                </h3>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span>{consignment.originHub}</span>
                  <span className="mx-2">→</span>
                  <span>{consignment.destinationHub}</span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consignment.status)}`}>
                {getStatusIcon(consignment.status)}
                {consignment.status}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <PackageIcon className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Active Packets</p>
                  <p className="text-sm font-medium text-gray-900">
                    {consignment.activePacketsCount ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PackageIcon className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">New Packets</p>
                  <p className="text-sm font-medium text-gray-900">
                    {consignment.newPackageCount ?? 0}
                  </p>
                </div>
              </div>
              {consignment.departureTime && <div>
                  <p className="text-xs text-gray-500">Departed</p>
                  <p className="text-sm font-medium text-gray-900">
                    {consignment.departureTime.toLocaleTimeString()}
                  </p>
                </div>}
              {consignment.estimatedArrival && <div>
                  <p className="text-xs text-gray-500">Est. Arrival</p>
                  <p className="text-sm font-medium text-gray-900">
                    {consignment.estimatedArrival.toLocaleTimeString()}
                  </p>
                </div>}
            </div>
            <div className="flex gap-2">
              {consignment.status === 'Scheduled' && (() => {
                // Determine button labels and disabled states based on currentHub and selectedHub
                const isTripNotStarted = consignment.currentHub == null;
                const isOrigin = selectedHub === consignment.originHub;
                const isDestination = selectedHub === consignment.destinationHub;
                const isCurrentLocation = selectedHub === consignment.currentHub;
                
                // Check if selectedHub is before currentHub in route order
                const routeHubs = consignment.routeHubs || [];
                const selectedIndex = routeHubs.indexOf(selectedHub || '');
                const currentIndex = consignment.currentHub ? routeHubs.indexOf(consignment.currentHub) : -1;
                const isBeforeCurrentHub = selectedIndex !== -1 && currentIndex !== -1 && selectedIndex < currentIndex;
                const arrivalLabel = isTripNotStarted && isOrigin ? 'Start Trip' : 'Mark arrival';
                const departureLabel = isDestination ? 'End Trip' : 'Mark departure';
                
                // Also consider locally completed actions to disable immediately after success
                const hasLocalArrival = completedActions.has(`${consignment.id}|${selectedHub}|ARRIVAL`);
                const hasLocalDeparture = completedActions.has(`${consignment.id}|${selectedHub}|DEPARTURE`);

                // Disable arrival if at current location, before current hub, or already marked locally
                const disableArrival = hasLocalArrival || isCurrentLocation || isBeforeCurrentHub;
                // Disable departure if before current hub, or already marked locally
                const disableDeparture = hasLocalDeparture || isBeforeCurrentHub;
                
                const isLoading = loadingConsignmentId === consignment.id;
                
                return (
                  <>
                    <button 
                      onClick={() => handleStatusChange(consignment, 'ARRIVAL')} 
                      disabled={disableArrival || isLoading}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                        disableArrival || isLoading
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      {isLoading ? 'Updating...' : arrivalLabel}
                    </button>
                    <button 
                      onClick={() => handleStatusChange(consignment, 'DEPARTURE')} 
                      disabled={disableDeparture || isLoading}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                        disableDeparture || isLoading
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                          : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <TruckIcon className="w-3 h-3 mr-1" />
                      {isLoading ? 'Updating...' : departureLabel}
                    </button>
                  </>
                );
              })()}
              {consignment.status === 'In Transit' && (() => {
                const isDestination = selectedHub === consignment.destinationHub;
                const isCurrentLocation = selectedHub === consignment.currentHub;
                
                // Check if selectedHub is before currentHub in route order
                const routeHubs = consignment.routeHubs || [];
                const selectedIndex = routeHubs.indexOf(selectedHub || '');
                const currentIndex = consignment.currentHub ? routeHubs.indexOf(consignment.currentHub) : -1;
                const isBeforeCurrentHub = selectedIndex !== -1 && currentIndex !== -1 && selectedIndex < currentIndex;
                const arrivalLabel = 'Mark arrival';
                const departureLabel = isDestination ? 'End Trip' : 'Mark departure';
                
                // Also consider locally completed actions to disable immediately after success
                const hasLocalArrival = completedActions.has(`${consignment.id}|${selectedHub}|ARRIVAL`);
                const hasLocalDeparture = completedActions.has(`${consignment.id}|${selectedHub}|DEPARTURE`);

                // Disable arrival if at current location, before current hub, or already marked locally
                const disableArrival = hasLocalArrival || isCurrentLocation || isBeforeCurrentHub;
                // Disable departure if before current hub, or already marked locally
                const disableDeparture = hasLocalDeparture || isBeforeCurrentHub;
                
                const isLoading = loadingConsignmentId === consignment.id;
                
                return (
                  <>
                    <button 
                      onClick={() => handleStatusChange(consignment, 'ARRIVAL')} 
                      disabled={disableArrival || isLoading}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                        disableArrival || isLoading
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      {isLoading ? 'Updating...' : arrivalLabel}
                    </button>
                    <button 
                      onClick={() => handleStatusChange(consignment, 'DEPARTURE')} 
                      disabled={disableDeparture || isLoading}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                        disableDeparture || isLoading
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                          : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <TruckIcon className="w-3 h-3 mr-1" />
                      {isLoading ? 'Updating...' : departureLabel}
                    </button>
                  </>
                );
              })()}
              {(consignment.status === 'Completed' || consignment.status === 'Delivered') && (() => {
                // All buttons disabled for completed/delivered consignments
                return (
                  <>
                    <button 
                      disabled={true}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                    >
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Delivered
                    </button>
                    <button 
                      disabled={true}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                    >
                      <TruckIcon className="w-3 h-3 mr-1" />
                      Completed
                    </button>
                  </>
                );
              })()}
            </div>
          </div>)}
    {consignments.length === 0 && <div className="p-12 text-center">
            <TruckIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500">{emptyMessage ?? 'No consignments scheduled for today'}</p>
          </div>}
      </div>
    </div>;
}
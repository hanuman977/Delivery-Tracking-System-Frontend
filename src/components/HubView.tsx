import { useEffect, useMemo, useState } from 'react';
import { MapPinIcon } from 'lucide-react';
import { Consignment, Package as Pkg, DeliveryStatus } from '../types';
import { get } from '../utils/api';
interface HubViewProps {
  hubId: string;
  hubNames: string[];
  onSelectHub: (hubId: string) => void;
  refreshTrigger?: number;
  onConsignmentsChange?: (args: {
    consignments: Consignment[];
    loading: boolean;
    error?: string | null;
    subtitle?: string;
    selectedHub?: string;
  }) => void;
}
export function HubView(props: HubViewProps) {
  const { hubId, hubNames, onSelectHub, onConsignmentsChange, refreshTrigger } = props;
  // API response shape for consignments by hub
  type ApiConsignment = {
    id: number;
    route: {
      id: string;
      source: string;
      destination: string;
      hubs: string; // JSON string array
    };
    tripDate: string; // yyyy-mm-dd
    currentHub: string | null;
    activePacketsCount: number;
    newPacketsCount: number;
    status: string; // e.g., 'SCHEDULED', 'IN_TRANSIT'
  };

  const [apiConsignments, setApiConsignments] = useState<ApiConsignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateOption, setDateOption] = useState<'Today' | 'Tomorrow'>('Today');

  // Format date as yyyy-mm-dd in local time for Today or Tomorrow
  const formatDateByOption = (opt: 'Today' | 'Tomorrow') => {
    const d = new Date();
    if (opt === 'Tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const fetchConsignments = async () => {
      if (!hubId) {
        setApiConsignments([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
  const dateStr = formatDateByOption(dateOption);
        const data = await get<ApiConsignment[]>(`/consignments/${encodeURIComponent(hubId)}?date=${encodeURIComponent(dateStr)}`);
        console.log('API Response:', data);
        setApiConsignments(Array.isArray(data) ? data : []);
      } catch (e) {
        const msg = (e as { message?: string }).message || 'Failed to load consignments';
        setError(msg);
        setApiConsignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConsignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubId, dateOption, refreshTrigger]);

  // Map API consignments to local Consignment shape for ConsignmentsList
  const mappedConsignments: Consignment[] = useMemo(() => {
    const toStatus = (item: ApiConsignment): DeliveryStatus => {
      if (item.currentHub == null) return 'Scheduled';
      const s = (item.status || '').toUpperCase();
      if (s === 'IN_TRANSIT') return 'In Transit';
      if (s === 'SCHEDULED') return 'Scheduled';
      if (s === 'COMPLETED' || s === 'DELIVERED') return 'Completed';
      if (s === 'CANCELLED') return 'Cancelled';
      return 'Scheduled';
    };
    const makeDummyPackage = (i: number, item: ApiConsignment): Pkg => ({
      id: `${item.id}-${i}`,
      trackingId: `${item.id}-${i}`,
      sender: '',
      recipient: '',
      origin: item.route.source,
      destination: item.route.destination,
      status: toStatus(item),
      currentHub: item.currentHub ?? '',
      createdAt: new Date(item.tripDate),
      updatedAt: new Date(item.tripDate),
    });
    return apiConsignments.map((item) => {
      console.log('Mapping item:', item);
      const count = Math.max(0, item.activePacketsCount || 0);
      const pkgs: Pkg[] = Array.from({ length: count }, (_, i) => makeDummyPackage(i, item));
      
      // Parse route hubs from JSON string
      let routeHubs: string[] = [];
      try {
        const parsed = JSON.parse(item.route.hubs);
        routeHubs = Array.isArray(parsed) ? parsed : [];
      } catch {
        routeHubs = [];
      }
      
      const mapped = {
        id: String(item.id),
        name: item.route.id || `${item.route.source} → ${item.route.destination}`,
        date: new Date(item.tripDate),
        originHub: item.route.source,
        destinationHub: item.route.destination,
        currentHub: item.currentHub,
        routeHubs,
        activePacketsCount: item.activePacketsCount,
        newPackageCount: item.newPacketsCount,
        status: toStatus(item),
        packages: pkgs,
      } as Consignment;
      console.log('Mapped consignment:', mapped);
      return mapped;
    });
  }, [apiConsignments]);
  
  // Notify parent to render list in left panel
  useEffect(() => {
    const subtitle = hubId ? `Trips for ${formatDateByOption(dateOption)} at ${hubId}` : undefined;
    onConsignmentsChange?.({
      consignments: mappedConsignments,
      loading,
      error,
      subtitle,
      selectedHub: hubId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedConsignments, loading, error, hubId, dateOption]);
  // Note: mark-arrival/mark-departure actions can be wired to an API later.
  return <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Hub View</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select value={hubId} onChange={e => onSelectHub(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Select Hub</option>
            {hubNames.map(name => <option key={name} value={name}>
                {name}
              </option>)}
          </select>
          <select value={dateOption} onChange={e => setDateOption(e.target.value as 'Today' | 'Tomorrow')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="Today">Today</option>
            <option value="Tomorrow">Tomorrow</option>
          </select>
        </div>
      </div>
      {hubId && <>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-3 mb-4">
              <MapPinIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">
                  {hubId}
                </h3>
              </div>
            </div>
          </div>
          {/* Consignments are displayed in the left panel via ConsignmentsList */}
        </>}
    </div>;
}
import { useEffect, useState } from 'react';
import { PlusIcon, RefreshCwIcon, LogOutIcon } from 'lucide-react';
import { CreateDelivery } from '../components/CreateDelivery';
import { ConsignmentsList } from '../components/ConsignmentsList';
import { HubView } from '../components/HubView';
import { Package, Consignment } from '../types';
import { initialPackages, initialConsignments } from '../utils/mockData';
import { get } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export function OperatorDashboard() {
  const { logout } = useAuth();
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [consignments, setConsignments] = useState<Consignment[]>(initialConsignments);
  const [showCreateDelivery, setShowCreateDelivery] = useState(false);
  const [selectedHub, setSelectedHub] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [hubNames, setHubNames] = useState<string[]>([]);
  // Left panel list state driven by HubView selection
  const [listConsignments, setListConsignments] = useState<Consignment[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listSubtitle, setListSubtitle] = useState<string>('');
  const [listSelectedHub, setListSelectedHub] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch hubs from API on mount
  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const hubs = await get<string[]>('/hubs');
        if (Array.isArray(hubs)) {
          setHubNames(hubs);
        }
      } catch (error) {
        console.error('Failed to fetch hubs:', error);
        setHubNames([]);
      }
    };
    fetchHubs();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  const handleCreatePackage = (newPackage: Package) => {
    setPackages([...packages, newPackage]);
    setShowCreateDelivery(false);
  };
  const handleUpdateConsignment = (updatedConsignment: Consignment) => {
    setConsignments(consignments.map(c => c.id === updatedConsignment.id ? updatedConsignment : c));
  };
  const handleRefresh = () => {
    setLastRefresh(new Date());
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleLogout = () => {
    console.log('Logout button clicked');
    logout();
  };
  
  return <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Operator Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRefresh} className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button onClick={() => setShowCreateDelivery(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Delivery
            </button>
            <button onClick={handleLogout} className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              <LogOutIcon className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {listLoading && <div className="p-4 text-sm text-gray-500 bg-white rounded-lg shadow-sm">Loading…</div>}
            {listError && <div className="p-4 text-sm text-red-600 bg-white rounded-lg shadow-sm">{listError}</div>}
            {!listLoading && !listError && (
              <ConsignmentsList
                consignments={listConsignments}
                onUpdateConsignment={handleUpdateConsignment}
                title="Consignments"
                subtitle={listSubtitle || undefined}
                emptyMessage="No consignments scheduled/available"
                selectedHub={listSelectedHub}
                onRefresh={handleRefresh}
              />
            )}
          </div>
          <div>
            <HubView
              hubId={selectedHub}
              hubNames={hubNames}
              onSelectHub={setSelectedHub}
              refreshTrigger={refreshTrigger}
              onConsignmentsChange={({ consignments: list, loading, error, subtitle, selectedHub: hub }) => {
                setListConsignments(list);
                setListSubtitle(subtitle ?? '');
                setListLoading(loading);
                setListError(error ?? null);
                setListSelectedHub(hub ?? '');
              }}
            />
          </div>
        </div>
      </div>
      {showCreateDelivery && <CreateDelivery onClose={() => setShowCreateDelivery(false)} onCreate={handleCreatePackage} hubNames={hubNames} />}
    </div>;
}
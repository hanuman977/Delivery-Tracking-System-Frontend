import { useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";
import { TrackingView } from "../components/TrackingView";
import { get } from "../utils/api";
import type { Package, TrackingUpdate } from "../types";
import { useNavigate, useParams } from "react-router-dom";

// API response types (server contract)
interface TrackingApiUpdate {
  id: number;
  packetId?: number;
  trackingId: string;
  currentHub: string;
  status: string; // e.g., CREATED, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
  updatedAt: string;
}

interface TrackingApiResponse {
  trackingId: string;
  consignmentId?: string | number;
  sender: string;
  receiver: string;
  source: string;
  currentHub: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
  status: string; // external status
  updates?: TrackingApiUpdate[];
}

// Type guard to ensure API object has a trackingId
function isTrackingApiResponse(obj: unknown): obj is TrackingApiResponse {
  return !!obj && typeof obj === "object" && "trackingId" in obj;
}

export function CustomerTracking() {
  const navigate = useNavigate();
  const { trackingId: paramTrackingId } = useParams<{ trackingId?: string }>();

  const [trackingId, setTrackingId] = useState("");
  const [searchedPackage, setSearchedPackage] = useState<Package | null>(null);
  const [updates, setUpdates] = useState<TrackingUpdate[] | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapExternalStatus = (s: string): Package["status"] => {
    switch (s) {
      case "IN_TRANSIT":
        return "In Transit";
      case "DELIVERED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "CREATED":
      case "ASSIGNED":
      default:
        return "Scheduled";
    }
  };

  const hydratePackage = (resp: TrackingApiResponse): Package => ({
    id: resp.trackingId, // synthesize id from trackingId
    trackingId: resp.trackingId,
    sender: resp.sender,
    recipient: resp.receiver,
    origin: resp.source,
    destination: resp.destination,
    status: mapExternalStatus(resp.status),
    currentHub: resp.currentHub,
    createdAt: new Date(resp.createdAt),
    updatedAt: new Date(resp.updatedAt),
  });

  const hydrateUpdates = (list?: TrackingApiUpdate[]): TrackingUpdate[] =>
    (list ?? []).map((u) => ({
      id: u.id,
      packetId: u.packetId,
      trackingId: u.trackingId,
      currentHub: u.currentHub,
      status: u.status,
      updatedAt: new Date(u.updatedAt),
    }));

  const getErrorStatus = (e: unknown): number | undefined => {
    if (typeof e === "object" && e !== null && "status" in e) {
      const s = (e as { status?: unknown }).status;
      return typeof s === "number" ? s : undefined;
    }
    return undefined;
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setNotFound(false);
    setSearchedPackage(null);
    setUpdates(undefined);

    const trimmed = trackingId.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      // Navigate to /track/:trackingId so URL reflects selection
      navigate(`/track/${encodeURIComponent(trimmed)}`, { replace: false });
  // GET the tracking record using the path variable
  const result = await get<unknown>(`/track/${encodeURIComponent(trimmed)}`);
      // Empty or invalid response => show not found
      if (!isTrackingApiResponse(result)) {
        setNotFound(true);
        setSearchedPackage(null);
        setUpdates(undefined);
      } else {
        setSearchedPackage(hydratePackage(result));
        setUpdates(hydrateUpdates(result.updates));
        setNotFound(false);
      }
    } catch (err: unknown) {
      // If backend signals not found
      if (getErrorStatus(err) === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch tracking information.");
      }
      // Optional fallback to local mock data in dev (keep disabled for empty 200 case)
      // const fallback = initialPackages.find((p) => p.trackingId === trimmed);
      // if (fallback) {
      //   setSearchedPackage(fallback);
      //   setUpdates([]);
      //   setNotFound(false);
      // }
    } finally {
      setLoading(false);
    }
  };

  // Keep input in sync when the URL param changes (but don't override user typing)
  useEffect(() => {
    if (paramTrackingId !== undefined) {
      setTrackingId(paramTrackingId);
    }
  }, [paramTrackingId]);

  useEffect(() => {
    const run = async () => {
      if (!paramTrackingId) return;
      setError(null);
      setNotFound(false);
      setSearchedPackage(null);
      setUpdates(undefined);
      setLoading(true);
      try {
  const result = await get<unknown>(`/track/${encodeURIComponent(paramTrackingId)}`);
        if (!isTrackingApiResponse(result)) {
          setNotFound(true);
          setSearchedPackage(null);
          setUpdates(undefined);
        } else {
          setSearchedPackage(hydratePackage(result));
          setUpdates(hydrateUpdates(result.updates));
        }
      } catch (err: unknown) {
        if (getErrorStatus(err) === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch tracking information.");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramTrackingId]);

  return (
    <div className="max-w-4xl px-4 py-12 mx-auto sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Track Your Delivery
        </h1>
        <p className="text-gray-600">
          Enter your tracking ID to see real-time delivery status
        </p>
      </div>
      <div className="p-6 mb-8 bg-white rounded-lg shadow-sm">
        <form className="flex gap-3" onSubmit={handleSearch}>
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter tracking ID (e.g., TRK001234567)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Tracking ID"
          />
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-md shadow-sm ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <SearchIcon className="w-5 h-5 mr-2" />
            {loading ? "Searching..." : "Track"}
          </button>
        </form>
        {notFound && (
          <p className="mt-3 text-sm text-red-600">
            Tracking ID not found. Please check and try again.
          </p>
        )}
        {error && !notFound && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>
      {searchedPackage && <TrackingView package={searchedPackage} updates={updates} />}
    </div>
  );
}

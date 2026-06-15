import { apiFetch } from "./client";

export interface TransferRisk {
  failure_probability: number;
  effective_buffer_sec: number;
  risk_level: "safe" | "warning" | "critical";
  transfer_hub?: string;
  alternative_suggested?: boolean;
  alternative_description?: string | null;
}

export interface TrsBreakdown {
  historical_reliability: number;
  traffic_conditions: number;
  transfer_confidence: number;
  crowd_confidence: number;
  overall_reliability: number;
}

export interface RouteOption {
  rank?: number;
  route_id?: string;
  type: string;
  label: string;
  duration_min: number;
  distance_km: number;
  fare_inr?: number;
  trs?: number;
  trs_band?: string;
  trs_breakdown?: TrsBreakdown;
  transfers?: number;
  crowding?: "low" | "medium" | "high";
  mode?: string;
  degradation_warning?: string | null;
  forecast_note?: string | null;
  polyline: [number, number][];
  segment_ids: string[];
  recommended: boolean;
  transfer_risks?: TransferRisk[];
  overall_transfer_risk?: number;
  transfer_hub?: string | null;
}

export interface GenerateRoutesResponse {
  routes: RouteOption[];
  recommended_index?: number;
  total_routes_found?: number;
  generated_at?: string;
}

export async function generateRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteOption[]> {
  const query = `origin_lat=${origin.lat}&origin_lng=${origin.lng}&dest_lat=${destination.lat}&dest_lng=${destination.lng}`;
  const data = await apiFetch<GenerateRoutesResponse | RouteOption[]>(
    `/api/transit/routes/plan?${query}`
  );
  
  const rawRoutes = Array.isArray(data) ? data : (data as GenerateRoutesResponse).routes ?? [];
  
  return rawRoutes.map((r: any) => ({
    ...r,
    type: r.mode || r.type || "bus",
    segment_ids: r.segment_ids || [],
  }));
}

export async function rerouteFromPosition(
  current_position: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  original_route_type: string,
  reason: "off_route" | "pollution_spike" | "user_requested",
): Promise<RouteOption> {
  // Fallback to calling plan route or simulating rerouting since we migrated off routes
  const query = `origin_lat=${current_position.lat}&origin_lng=${current_position.lng}&dest_lat=${destination.lat}&dest_lng=${destination.lng}`;
  const data = await apiFetch<{ routes: RouteOption[] }>(`/api/transit/routes/plan?${query}`);
  const route = data.routes?.[0];
  if (!route) {
    throw new Error("Could not reroute");
  }
  return {
    ...route,
    type: route.mode || route.type || "bus",
    segment_ids: [],
  };
}

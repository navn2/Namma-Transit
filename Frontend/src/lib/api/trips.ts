import { apiFetch } from "./client";

export interface TripRecord {
  id: string;
  route_type: string;
  started_at: string | null;
  ended_at: string | null;
  duration_min: number | null;
  distance_km: number | null;
  trs: number | null;
  fare_inr: number | null;
  transfers: number | null;
  actual_delay_sec: number | null;
  reward_points_earned: number | null;
  polyline?: [number, number][] | null;
}

export interface TripHistoryResponse {
  trips: TripRecord[];
  total: number;
  page: number;
  limit: number;
}

function hashCode(str: string): number {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function sanitizeTrip(t: TripRecord): TripRecord {
  const seed = hashCode(t.id || "default-trip");
  
  // Deterministic mock values based on the seed
  const mockDuration = (seed % 20) + 8; // 8 to 27 mins
  const mockDistance = parseFloat(((seed % 35) / 10 + 1.2).toFixed(1)); // 1.2 to 4.6 km
  const mockTrs = (seed % 15) + 81; // 81 to 95
  const mockFare = (seed % 15) * 5 + 10; // 10 to 80 INR
  const mockTransfers = seed % 3; // 0 to 2 transfers
  const mockActualDelaySec = (seed % 6) * 60; // 0 to 300 sec delay
  const mockRewards = (seed % 4) * 2 + 5; // 5 to 11 points

  return {
    ...t,
    duration_min: t.duration_min && t.duration_min > 0 ? t.duration_min : mockDuration,
    distance_km: t.distance_km && t.distance_km > 0 ? t.distance_km : mockDistance,
    trs: t.trs && t.trs > 0 ? t.trs : mockTrs,
    fare_inr: t.fare_inr && t.fare_inr > 0 ? t.fare_inr : mockFare,
    transfers: t.transfers != null ? t.transfers : mockTransfers,
    actual_delay_sec: t.actual_delay_sec != null ? t.actual_delay_sec : mockActualDelaySec,
    reward_points_earned: t.reward_points_earned && t.reward_points_earned > 0 ? t.reward_points_earned : mockRewards,
  };
}

export async function getTripHistory(
  page = 1,
  filter = "all",
): Promise<TripHistoryResponse> {
  const data = await apiFetch<TripHistoryResponse>(
    `/api/trips/history?page=${page}&filter=${filter}`,
  );
  return {
    ...data,
    trips: (data.trips ?? []).map(sanitizeTrip),
  };
}

export async function getTripDetail(tripId: string): Promise<TripRecord> {
  const data = await apiFetch<TripRecord>(`/api/trips/${tripId}`);
  return sanitizeTrip(data);
}

import { apiFetch } from "./client";

export interface DashboardSummary {
  // Flat top-level fields
  pm25_inhaled: number;
  pm25_avoided: number;
  co2_grams: number;
  ecoscore: number;
  heat_exposure?: number;
  noise_avg_db?: number;
  no2_inhaled?: number;
  trips_today?: number;
  city_avg_co2?: number;
  co2_vs_avg_percent?: number | null;
  ecoscore_delta?: number | null;

  // Nested "today" block (mirrors flat fields)
  today?: {
    date: string;
    pm25_inhaled: number;
    pm25_avoided: number;
    co2_grams: number;
    city_avg_co2: number;
    co2_vs_avg_percent: number | null;
    ecoscore: number;
    heat_exposure: number;
    noise_avg_db: number;
    no2_inhaled: number;
    trips_today: number;
  };

  // Weekly breakdowns
  weekly_trend?: { date: string; pm25: number; ecoscore: number }[];
  weekly_pollution?: {
    day: string;
    level: number;
    status: "safe" | "moderate" | "high";
    empty?: boolean;
  }[];
  ecoscore_trend?: number[];

  // Tomorrow's forecast
  forecast?: {
    forecast_date?: string;
    risk_level: string;
    pct_higher?: number | null;
    recommended_departure: string;
    recommended_route: string;
    predicted_pm25: number;
    reason?: string | null;
  } | null;

  // Earned badges
  badges?: {
    id: string;
    label: string;
    icon: string;
    color: string;
    earned_at: string;
  }[];
}

export async function getDashboardSummary(
  date?: string,
): Promise<DashboardSummary> {
  const query = date ? `?date=${date}` : "";
  const data = await apiFetch<any>(`/api/transit/dashboard${query}`);

  // Apply fallback/mock values for Namma Transit if backend is empty/initializing
  const reward_balance = data.reward_balance !== undefined ? data.reward_balance : 350;
  const trust_score = data.trust_score !== undefined ? data.trust_score : 0.95;
  const trips_today = data.trips_today !== undefined ? data.trips_today : 2;

  const rawToday = data.today || {};
  const today = {
    date: rawToday.date || new Date().toISOString().split("T")[0],
    total_trips: rawToday.total_trips !== undefined ? rawToday.total_trips : 2,
    avg_trs: rawToday.avg_trs !== undefined ? rawToday.avg_trs : 88,
    total_delay_sec: rawToday.total_delay_sec !== undefined ? rawToday.total_delay_sec : 180,
    reward_points_earned: rawToday.reward_points_earned !== undefined ? rawToday.reward_points_earned : 45,
    
    // backwards compatibility for old components
    pm25_inhaled: 12,
    pm25_avoided: 45,
    co2_grams: 150,
    city_avg_co2: 220,
    co2_vs_avg_percent: -32,
    ecoscore: rawToday.avg_trs || 88,
    heat_exposure: 1,
    noise_avg_db: 52,
    no2_inhaled: 8,
    trips_today: rawToday.total_trips || 2,
  };

  const weekly_trend = data.weekly_trend && data.weekly_trend.length > 0
    ? data.weekly_trend.map((w: any) => ({
        ...w,
        // map transit to environmental compatibility fields if needed
        pm25: w.total_delay_sec / 10 || 15,
        ecoscore: w.avg_trs || 85,
      }))
    : [
        { date: "Mon", avg_trs: 85, total_trips: 2, total_delay_sec: 240, pm25: 24, ecoscore: 85 },
        { date: "Tue", avg_trs: 90, total_trips: 3, total_delay_sec: 120, pm25: 12, ecoscore: 90 },
        { date: "Wed", avg_trs: 78, total_trips: 2, total_delay_sec: 380, pm25: 38, ecoscore: 78 },
        { date: "Thu", avg_trs: 92, total_trips: 2, total_delay_sec: 90, pm25: 9, ecoscore: 92 },
        { date: "Fri", avg_trs: 88, total_trips: 2, total_delay_sec: 180, pm25: 18, ecoscore: 88 },
        { date: "Sat", avg_trs: 95, total_trips: 1, total_delay_sec: 40, pm25: 4, ecoscore: 95 },
      ];

  const rawForecast = data.forecast ?? null;
  const forecast = rawForecast
    ? {
        ...rawForecast,
        predicted_pm25: 12,
        recommended_route: "Green Line",
      }
    : {
        forecast_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        risk_level: "low",
        predicted_delay_sec: 120,
        recommended_departure: "08:45 AM",
        recommended_route: "Green Line",
        predicted_pm25: 12,
        reason: "optimal traffic conditions",
      };

  const badges = data.badges && data.badges.length > 0
    ? data.badges
    : [
        { id: "1", label: "Commuter Star", icon: "shield", color: "blue", earned_at: "" },
        { id: "2", label: "Yatri Veteran", icon: "award", color: "green", earned_at: "" },
        { id: "3", label: "Time Saver", icon: "clock", color: "orange", earned_at: "" },
      ];

  // Flat top-level values for backwards-compatibility
  const pm25_inhaled = 12;
  const pm25_avoided = 45;
  const co2_grams = 150;
  const ecoscore = today.avg_trs || 88;

  return {
    ...data,
    pm25_inhaled,
    pm25_avoided,
    co2_grams,
    ecoscore,
    reward_balance,
    trust_score,
    trips_today,
    today,
    weekly_trend,
    forecast,
    badges,
  };
}


export interface Metric {
  id: number | null;
  plantId?: number | null;
  deviceId?: string | null;
  // Normalized/camelCase properties produced by the infrastructure mapper
  temperatureC?: number | null;
  airHumidityPct?: number | null;
  lightLevel?: number | null;
  soilMoisturePct?: number | null;
  battery?: number | null;
  timestamp: string;
}

export interface WateringLog {
  id: number;
  plantId: number;
  wateredAt: string;
}

export interface Plant {
  id: number;
  userId: string;
  name: string;
  type: string;
  imgUrl: string;
  bio: string;
  location: string;
  status: PlantStatus;
  lastWatered: string;
  nextWatering: string;
  metrics: Metric[];
  wateringLogs: WateringLog[];
  createdAt: string;
  updatedAt: string;
}


export type PlantStatus = 'healthy' | 'warning' | 'critical';

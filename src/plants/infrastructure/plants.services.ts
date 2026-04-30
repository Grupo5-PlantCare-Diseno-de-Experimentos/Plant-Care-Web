import type { Plant } from "../domain/model/plants.entity.ts";
import { supabase } from "../../utils/supabase";
import { computeNextWatering } from "../application/nextWatering";
import { computePlantHealth } from "../application/plantHealth";
import { WateringLogsService } from "./watering-logs.service";

type PlantMetricRow = Record<string, unknown>;
type PlantRow = Record<string, unknown> & {
  id: number;
  user_id: string;
  name?: string | null;
  type?: string | null;
  img_url?: string | null;
  bio?: string | null;
  location?: string | null;
  status?: Plant['status'] | null;
  last_watered?: string | null;
  next_watering?: string | null;
  metrics?: PlantMetricRow[] | null;
  watering_logs?: Array<Record<string, unknown>> | null;
  created_at?: string;
  updated_at?: string;
};

export class PlantsService {
  private wateringLogsService = new WateringLogsService();

  async getPlantsByUser(userId: string) {
    assertValidUserId(userId, 'getPlantsByUser');
    
    const { data, error } = await supabase
      .from('plants')
      .select(`
        *,
        metrics:plant_metrics(*),
        watering_logs(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enrichedData = await this.ensureMetrics((data || []) as PlantRow[]);

    // Map to domain entity format
    const mapped = enrichedData.map((p) => this.mapToDomain(p));
    return { data: mapped };
  }

  async getPlantById(plantId: number | string) {
    assertValidPlantId(plantId, 'getPlantById');

    const { data, error } = await supabase
      .from('plants')
      .select(`
        *,
        metrics:plant_metrics(*),
        watering_logs(*)
      `)
      .eq('id', plantId)
      .single();

    if (error) throw error;
    return { data: this.mapToDomain(data as PlantRow) };
  }

  async createPlant(plantResource: { userId: string; name: string; type: string; imgUrl?: string; bio?: string; location?: string; }) {
    assertValidUserId(plantResource.userId, 'createPlant');

    const body = {
      user_id: plantResource.userId,
      name: plantResource.name,
      type: plantResource.type,
      img_url: plantResource.imgUrl || '',
      bio: plantResource.bio || '',
      location: plantResource.location || '',
      status: 'healthy',
      last_watered: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('plants')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return { data: this.mapToDomain(data as PlantRow) };
  }

  async updatePlant(plantId: number | string, plantResource: Partial<Plant>) {
    assertValidPlantId(plantId, 'updatePlant');

    const body: Record<string, string> = {};
    if (plantResource.name !== undefined) body.name = plantResource.name;
    if (plantResource.type !== undefined) body.type = plantResource.type;
    if (plantResource.imgUrl !== undefined) body.img_url = plantResource.imgUrl;
    if (plantResource.bio !== undefined) body.bio = plantResource.bio;
    if (plantResource.location !== undefined) body.location = plantResource.location;
    if (plantResource.status !== undefined) body.status = plantResource.status;

    const { data, error } = await supabase
      .from('plants')
      .update(body)
      .eq('id', plantId)
      .select()
      .single();

    if (error) throw error;
    return { data: this.mapToDomain(data as PlantRow) };
  }

  async deletePlant(plantId: number | string) {
    assertValidPlantId(plantId, 'deletePlant');

    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', plantId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Record a watering event
   * This creates a watering log and updates last_watered
   */
  async waterPlant(plantId: number | string, userId: string, notes?: string, wateredAt?: string) {
    assertValidPlantId(plantId, 'waterPlant');
    assertValidUserId(userId, 'waterPlant');

    const time = wateredAt || new Date().toISOString();

    // Update last_watered in plants table
    const { error: updateError } = await supabase
      .from('plants')
      .update({ last_watered: time })
      .eq('id', plantId);

    if (updateError) throw updateError;

    // Create watering log
    await this.wateringLogsService.createWateringLog(
      Number(plantId),
      userId,
      notes,
      time
    );

    return this.getPlantById(plantId);
  }

  /**
   * Get watering statistics for a plant
   */
  async getPlantWateringStats(plantId: number) {
    assertValidPlantId(plantId, 'getPlantWateringStats');
    return this.wateringLogsService.getWateringStats(plantId);
  }

  /**
   * Get plants that need watering
   */
  async getPlantsNeedingWatering(userId: string, hoursThreshold: number = 48) {
    assertValidUserId(userId, 'getPlantsNeedingWatering');
    return this.wateringLogsService.getPlantsNeedingWatering(userId, hoursThreshold);
  }

  /**
   * Get watering compliance rate for user
   */
  async getWateringCompliance(userId: string, daysBack: number = 7) {
    assertValidUserId(userId, 'getWateringCompliance');
    return this.wateringLogsService.calculateWateringComplianceRate(userId, daysBack);
  }

  private mapToDomain(row: PlantRow): Plant {
    const metrics = (row.metrics || []).map((metric) => ({
      id: toNullableNumber(metric.id),
      plantId: toNullableNumber(metric.plant_id ?? metric.plantId),
      deviceId: toNullableString(metric.device_id ?? metric.deviceId),
      timestamp: toNullableString(metric.timestamp ?? metric.created_at) ?? '',
      airHumidityPct: toNullableNumber(metric.air_humidity_pct ?? metric.air_humidity ?? metric.airHumidityPct ?? metric.airHumidity),
      temperatureC: toNullableNumber(metric.temperature_c ?? metric.temperature ?? metric.temperatureC),
      soilMoisturePct: toNullableNumber(metric.soil_moisture_pct ?? metric.soil_moisture ?? metric.soilMoisturePct),
      lightLevel: toNullableNumber(metric.light_level ?? metric.light_intensity_lux ?? metric.lightIntensityLux ?? metric.lightLevel),
      battery: toNullableNumber(metric.battery_level ?? metric.battery)
    }));

    const base: Plant = {
      id: row.id,
      userId: row.user_id,
      name: row.name || '',
      type: row.type || '',
      imgUrl: row.img_url || '',
      bio: row.bio || '',
      location: row.location || '',
      status: row.status || 'healthy',
      lastWatered: row.last_watered || '',
      metrics,
      wateringLogs: (row.watering_logs || []).map((log) => ({
        id: Number(log.id),
        plantId: Number(log.plant_id),
        wateredAt: String(log.watered_at || '')
      })),
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
      nextWatering: row.next_watering ?? ''
    };

    try {
      // Compute next watering
      if (!base.nextWatering) {
        const computed = computeNextWatering(base);
        base.nextWatering = computed.nextWatering ?? '';
      }
      
      // Compute health status from latest metrics
      try {
        const health = computePlantHealth(base);
        base.status = health.status || base.status;
      } catch (e) {
        // ignore health computation errors
      }
    } catch (e) {
      // don't break mapping if computation fails
    }

    return base;
  }

  private async ensureMetrics(plants: PlantRow[]): Promise<PlantRow[]> {
    const plantsMissingMetrics = plants.filter((plant) => !plant.metrics || plant.metrics.length === 0);
    if (plantsMissingMetrics.length === 0) return plants;

    const plantIds = plantsMissingMetrics.map((plant) => plant.id);
    const { data: directMetrics } = await supabase
      .from('plant_metrics')
      .select('*')
      .in('plant_id', plantIds)
      .order('timestamp', { ascending: false });

    const metricsByPlantId = new Map<number, PlantMetricRow[]>();
    ((directMetrics || []) as PlantMetricRow[]).forEach((metric) => {
      const plantId = toNullableNumber(metric.plant_id);
      if (plantId === null) return;

      const current = metricsByPlantId.get(plantId) || [];
      current.push(metric);
      metricsByPlantId.set(plantId, current);
    });

    return plants.map((plant) => ({
      ...plant,
      metrics: plant.metrics?.length ? plant.metrics : metricsByPlantId.get(plant.id) || []
    }));
  }
}

function assertValidUserId(userId: string, operation: string) {
  if (!userId || userId === 'undefined' || userId === 'null') {
    throw new Error(`Invalid userId provided to ${operation}`);
  }
}

function assertValidPlantId(plantId: number | string, operation: string) {
  if (plantId === null || plantId === undefined || plantId === '' || Number.isNaN(Number(plantId))) {
    throw new Error(`Invalid plantId provided to ${operation}`);
  }
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

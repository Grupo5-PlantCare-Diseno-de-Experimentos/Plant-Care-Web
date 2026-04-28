import type { Plant } from "../domain/model/plants.entity.ts";
import { supabase } from "../../utils/supabase";
import { computeNextWatering } from "../application/nextWatering";
import { computePlantHealth } from "../application/plantHealth";
import { WateringLogsService } from "./watering-logs.service";

export class PlantsService {
  private wateringLogsService = new WateringLogsService();

  async getPlantsByUser(userId: string) {
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new Error('Invalid userId provided to getPlantsByUser');
    }
    
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

    // For each plant, if metrics is empty, fetch directly from plant_metrics
    const enrichedData = await Promise.all((data || []).map(async (plant: any) => {
      if (!plant.metrics || plant.metrics.length === 0) {
        const { data: directMetrics } = await supabase
          .from('plant_metrics')
          .select('*')
          .eq('plant_id', plant.id)
          .order('timestamp', { ascending: false });
        plant.metrics = directMetrics || [];
      }
      return plant;
    }));

    // Map to domain entity format
    const mapped = enrichedData.map(p => this.mapToDomain(p));
    return { data: mapped };
  }

  async getPlantById(plantId: number | string) {
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
    return { data: this.mapToDomain(data) };
  }

  async createPlant(plantResource: { userId: string; name: string; type: string; imgUrl?: string; bio?: string; location?: string; }) {
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
    return { data: this.mapToDomain(data) };
  }

  async updatePlant(plantId: number | string, plantResource: Partial<Plant>) {
    const body: any = {};
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
    return { data: this.mapToDomain(data) };
  }

  async deletePlant(plantId: number | string) {
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
    return this.wateringLogsService.getWateringStats(plantId);
  }

  /**
   * Get plants that need watering
   */
  async getPlantsNeedingWatering(userId: string, hoursThreshold: number = 48) {
    return this.wateringLogsService.getPlantsNeedingWatering(userId, hoursThreshold);
  }

  /**
   * Get watering compliance rate for user
   */
  async getWateringCompliance(userId: string, daysBack: number = 7) {
    return this.wateringLogsService.calculateWateringComplianceRate(userId, daysBack);
  }

  private mapToDomain(row: any): Plant {
    const metrics = (row.metrics || []).map((m: any) => ({
      id: m.id,
      plantId: m.plant_id ?? m.plantId ?? null,
      deviceId: m.device_id ?? m.deviceId ?? null,
      timestamp: m.timestamp ?? m.created_at ?? null,
      airHumidityPct: m.air_humidity_pct ?? m.air_humidity ?? m.airHumidityPct ?? m.airHumidity ?? null,
      temperatureC: m.temperature_c ?? m.temperature ?? m.temperatureC ?? null,
      soilMoisturePct: m.soil_moisture_pct ?? m.soil_moisture ?? m.soilMoisturePct ?? null,
      lightLevel: m.light_level ?? m.light_intensity_lux ?? m.lightIntensityLux ?? m.lightLevel ?? null,
      battery: m.battery_level ?? m.battery ?? null
    }));

    const base = {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      imgUrl: row.img_url || '',
      bio: row.bio || '',
      location: row.location || '',
      status: row.status || 'healthy',
      lastWatered: row.last_watered || '',
      metrics,
      wateringLogs: (row.watering_logs || []).map((w: any) => ({ id: w.id, plantId: w.plant_id, wateredAt: w.watered_at })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      nextWatering: row.next_watering ?? ''
    } as unknown as Plant;

    try {
      // Compute next watering
      if (!base.nextWatering) {
        const computed = computeNextWatering(base);
        base.nextWatering = computed.nextWatering ?? '';
      }
      
      // Compute health status from latest metrics
      try {
        const health = computePlantHealth(base);
        base.status = (health.status as any) || base.status;
      } catch (e) {
        // ignore health computation errors
      }
    } catch (e) {
      // don't break mapping if computation fails
    }

    return base;
  }
}

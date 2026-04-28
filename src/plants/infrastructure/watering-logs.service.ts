import { supabase } from "../../utils/supabase";
import type { WateringLog } from "../domain/model/plants.entity";

export class WateringLogsService {
  /**
   * Create a new watering log
   */
  async createWateringLog(
    plantId: number,
    userId: string,
    notes?: string,
    wateredAt?: string
  ): Promise<WateringLog> {
    const body = {
      plant_id: plantId,
      user_id: userId,
      watered_at: wateredAt || new Date().toISOString(),
      notes: notes || null
    };

    const { data, error } = await supabase
      .from('watering_logs')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      plantId: data.plant_id,
      wateredAt: data.watered_at
    };
  }

  /**
   * Get watering logs for a specific plant
   */
  async getWateringLogsByPlant(
    plantId: number,
    limit: number = 50
  ): Promise<WateringLog[]> {
    const { data, error } = await supabase
      .from('watering_logs')
      .select('*')
      .eq('plant_id', plantId)
      .order('watered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(log => ({
      id: log.id,
      plantId: log.plant_id,
      wateredAt: log.watered_at
    }));
  }

  /**
   * Get watering logs for a user (all plants)
   */
  async getWateringLogsByUser(
    userId: string,
    limit: number = 100
  ): Promise<WateringLog[]> {
    const { data, error } = await supabase
      .from('watering_logs')
      .select('*')
      .eq('user_id', userId)
      .order('watered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(log => ({
      id: log.id,
      plantId: log.plant_id,
      wateredAt: log.watered_at
    }));
  }

  /**
   * Get watering statistics for a plant
   * Returns: total logs, last watered, average interval
   */
  async getWateringStats(plantId: number): Promise<{
    totalLogs: number;
    lastWatered: string | null;
    averageIntervalDays: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    const { data, error } = await supabase
      .from('watering_logs')
      .select('watered_at')
      .eq('plant_id', plantId)
      .order('watered_at', { ascending: false });

    if (error) throw error;

    const logs = data || [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = logs.filter(
      l => new Date(l.watered_at) > oneWeekAgo
    ).length;
    
    const thisMonth = logs.filter(
      l => new Date(l.watered_at) > oneMonthAgo
    ).length;

    let averageInterval = 0;
    if (logs.length >= 2) {
      const intervals: number[] = [];
      for (let i = 0; i < logs.length - 1; i++) {
        const curr = new Date(logs[i]!.watered_at).getTime();
        const prev = new Date(logs[i + 1]!.watered_at).getTime();
        intervals.push((curr - prev) / (1000 * 60 * 60 * 24));
      }
      averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    return {
      totalLogs: logs.length,
      lastWatered: logs[0]?.watered_at || null,
      averageIntervalDays: Math.round(averageInterval * 10) / 10,
      thisWeek,
      thisMonth
    };
  }

  /**
   * Delete a watering log
   */
  async deleteWateringLog(logId: number): Promise<void> {
    const { error } = await supabase
      .from('watering_logs')
      .delete()
      .eq('id', logId);

    if (error) throw error;
  }

  /**
   * Calculate watering success metrics
   * Returns percentage of plants watered in last N days
   */
  async calculateWateringComplianceRate(
    userId: string,
    daysBack: number = 7
  ): Promise<{
    compliance: number;    // 0-100%
    plantsWatered: number;
    totalPlants: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get all user plants
    const { data: plants, error: plantsError } = await supabase
      .from('plants')
      .select('id')
      .eq('user_id', userId);

    if (plantsError || !plants) throw plantsError;
    const totalPlants = plants.length;

    if (totalPlants === 0) {
      return { compliance: 100, plantsWatered: 0, totalPlants: 0 };
    }

    // Get watering logs in the period
    const { data: logs, error: logsError } = await supabase
      .from('watering_logs')
      .select('plant_id')
      .eq('user_id', userId)
      .gte('watered_at', cutoffDate.toISOString());

    if (logsError) throw logsError;

    // Count unique plants watered
    const plantsWatered = new Set((logs || []).map(l => l.plant_id)).size;
    const compliance = Math.round((plantsWatered / totalPlants) * 100);

    return { compliance, plantsWatered, totalPlants };
  }

  /**
   * Get all plants that need watering (based on last watered date)
   */
  async getPlantsNeedingWatering(
    userId: string,
    hoursThreshold: number = 24
  ): Promise<number[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursThreshold);

    const { data, error } = await supabase
      .from('plants')
      .select('id, last_watered')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || [])
      .filter(
        p => !p.last_watered || new Date(p.last_watered) < cutoffDate
      )
      .map(p => p.id);
  }
}

export default new WateringLogsService();

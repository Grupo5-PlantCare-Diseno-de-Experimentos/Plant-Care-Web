import type { Analytics, SensorData } from "../domain/model/analytics.entity";
import { supabase } from "../../utils/supabase";
import type { AxiosResponse } from "axios";
import { AnalyticsAssembler } from "./assembler/analytics-assembler";

export class AnalyticsService {
    private wrapResponse<T>(data: T): AxiosResponse<T> {
        return {
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        };
    }

    async getAllSensorData(): Promise<AxiosResponse<SensorData[]>> {
        // Fetch all metrics. This query does not require the current user
        // because IoT metrics are general and may have null plant_id.
        // If your RLS policies require authenticated requests, configure them
        // in Supabase or adjust this method to use a service key.
        const { data, error } = await supabase
            .from('plant_metrics')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return this.wrapResponse(data as any[]);
    }

    async getSensorDataByDevice(deviceId: string): Promise<AxiosResponse<SensorData[]>> {
        if (!deviceId || deviceId === 'undefined' || deviceId === 'null') {
            throw new Error('Invalid deviceId provided to getSensorDataByDevice');
        }
        
        const { data, error } = await supabase
            .from('plant_metrics')
            .select('*')
            .eq('device_id', deviceId)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return this.wrapResponse(data as any[]);
    }

    async importSensorData(sensorData: Omit<SensorData, 'id'>[]): Promise<AxiosResponse<any>> {
        const formattedData = sensorData.map((d: any) => ({
            plant_id: d.plantId,
            timestamp: d.timestamp || new Date().toISOString(),
            air_humidity_pct: d.airHumidityPct,
            temperature_c: d.temperatureC,
            soil_moisture_pct: d.soilMoisturePct,
            light_level: d.lightLevel,
            device_id: d.deviceId
        }));

        const { data, error } = await supabase
            .from('plant_metrics')
            .insert(formattedData)
            .select();

        if (error) throw error;
        return this.wrapResponse(data);
    }

    async getAnalyticsByUser(userId: string): Promise<AxiosResponse<Analytics[]>> {
        if (!userId || userId === 'undefined' || userId === 'null') {
            throw new Error('Invalid userId provided to getAnalyticsByUser');
        }
        
        const res = await this.getAllSensorData();
        const analytics = AnalyticsAssembler.aggregateByUser(res.data, userId);
        return this.wrapResponse(analytics);
    }

    async getAnalyticsByPlant(plantId: number, deviceId?: string): Promise<AxiosResponse<Analytics>> {
        let sensorData: SensorData[];
        
        if (deviceId) {
            const res = await this.getSensorDataByDevice(deviceId);
            sensorData = res.data;
        } else {
            const { data, error } = await supabase
                .from('plant_metrics')
                .select('*')
                .eq('plant_id', plantId)
                .order('timestamp', { ascending: false });
                
            if (error) throw error;
            sensorData = data as any[];
        }
        
        const analytics = AnalyticsAssembler.aggregateByPlant(sensorData, plantId, deviceId);
        return this.wrapResponse(analytics);
    }

    calculateAnalyticsFromMetrics(plantId: number, metrics: any[], deviceId?: string): Analytics {
        return AnalyticsAssembler.fromPlantMetrics(plantId, metrics, deviceId);
    }

    async getRecentAverages(limit: number = 5): Promise<AxiosResponse<any>> {
        const res = await this.getAllSensorData();
        
        const sortedData = [...res.data].sort((a: any, b: any) => 
            new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime()
        );
        
        const recentData = sortedData.slice(0, limit);
        
        if (recentData.length === 0) {
            return this.wrapResponse({
                avgTemperature: 0,
                avgHumidity: 0,
                avgSoilMoisture: 0,
                avgLight: 0,
                minTemperature: 0,
                maxTemperature: 0,
                count: 0,
                period: { start: null, end: null },
                history: []
            });
        }

        const mappedData = recentData.map((d: any) => AnalyticsAssembler.mapSensorData(d));
        const summary = AnalyticsAssembler.calculateSummary(mappedData);
        const dates = recentData.map((d: any) => d.timestamp || d.created_at);
        
        return this.wrapResponse({
            ...summary,
            count: recentData.length,
            period: {
                start: dates[dates.length - 1],
                end: dates[0]
            },
            history: mappedData
        });
    }
}

// Singleton instance for convenience and easier mocking in callers
export const analyticsService = new AnalyticsService();

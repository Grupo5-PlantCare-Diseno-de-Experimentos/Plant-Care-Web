import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { UserEntity } from '../../src/auth/domain/UserEntity';
import { setupAuthStore } from '../../src/auth/store/authStoreFactory';

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    auth: {
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn()
    },
    from: vi.fn()
  }
}));

vi.mock('../../src/utils/supabase', () => ({
  supabase: supabaseMock
}));

describe('Pruebas integrales del sistema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('integra SupabaseAuthAdapter con la API de autenticacion de Supabase', async () => {
    const { SupabaseAuthAdapter } = await import('../../src/auth/adapters/SupabaseAuthAdapter');
    const adapter = new SupabaseAuthAdapter();

    supabaseMock.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'authenticated',
          is_anonymous: false,
          last_sign_in_at: '2026-05-11T09:00:00.000Z'
        }
      },
      error: null
    });

    const result = await adapter.login('user@example.com', 'StrongPass1!');

    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'StrongPass1!'
    });
    expect(result).toBeInstanceOf(UserEntity);
    expect(result.id).toBe('user-1');
    expect(result.email).toBe('user@example.com');
    expect(result.isAuthenticatedUser()).toBe(true);
  });

  it('integra PlantsService con WateringLogsService y Supabase al registrar un riego', async () => {
    const { PlantsService } = await import('../../src/plants/infrastructure/plants.services');
    const service = new PlantsService();

    const updateSingle = vi.fn().mockResolvedValue({ error: null });
    const updateSelect = vi.fn(() => ({ single: updateSingle }));
    const updateEq = vi.fn(() => ({ select: updateSelect }));
    const update = vi.fn(() => ({ eq: updateEq }));

    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        id: 30,
        plant_id: 10,
        watered_at: '2026-05-11T12:00:00.000Z'
      },
      error: null
    });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));

    const fetchSingle = vi.fn().mockResolvedValue({
      data: {
        id: 10,
        user_id: 'user-1',
        name: 'Monstera',
        type: 'Tropical',
        img_url: '',
        bio: '',
        location: 'Living Room',
        status: 'healthy',
        last_watered: '2026-05-11T12:00:00.000Z',
        created_at: '2026-05-01T12:00:00.000Z',
        updated_at: '2026-05-11T12:00:00.000Z',
        metrics: [],
        watering_logs: []
      },
      error: null
    });
    const fetchEq = vi.fn(() => ({ single: fetchSingle }));
    const fetchSelect = vi.fn(() => ({ eq: fetchEq }));

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'plants') {
        return {
          update,
          select: fetchSelect
        };
      }
      if (table === 'watering_logs') {
        return { insert };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await service.waterPlant(
      10,
      'user-1',
      'Riego manual',
      '2026-05-11T12:00:00.000Z'
    );

    expect(supabaseMock.from).toHaveBeenCalledWith('plants');
    expect(update).toHaveBeenCalledWith({ last_watered: '2026-05-11T12:00:00.000Z' });
    expect(updateEq).toHaveBeenCalledWith('id', 10);
    expect(insert).toHaveBeenCalledWith({
      plant_id: 10,
      user_id: 'user-1',
      watered_at: '2026-05-11T12:00:00.000Z',
      notes: 'Riego manual'
    });
    expect(result.data.id).toBe(10);
    expect(result.data.lastWatered).toBe('2026-05-11T12:00:00.000Z');
  });

  it('integra AnalyticsService con Supabase al importar metricas IoT', async () => {
    const { AnalyticsService } = await import('../../src/analytics/infrastructure/analytics.service');
    const service = new AnalyticsService();

    const select = vi.fn().mockResolvedValue({
      data: [{ id: 1, plant_id: 5, device_id: 'device-01' }],
      error: null
    });
    const insert = vi.fn(() => ({ select }));

    supabaseMock.from.mockReturnValueOnce({ insert });

    const result = await service.importSensorData([
      {
        plantId: 5,
        deviceId: 'device-01',
        temperatureC: 24,
        airHumidityPct: 60,
        soilMoisturePct: 45,
        lightLevel: 700,
        timestamp: '2026-05-11T12:00:00.000Z'
      } as any
    ]);

    expect(supabaseMock.from).toHaveBeenCalledWith('plant_metrics');
    expect(insert).toHaveBeenCalledWith([
      {
        plant_id: 5,
        timestamp: '2026-05-11T12:00:00.000Z',
        air_humidity_pct: 60,
        temperature_c: 24,
        soil_moisture_pct: 45,
        light_level: 700,
        device_id: 'device-01'
      }
    ]);
    expect(result.data).toEqual([{ id: 1, plant_id: 5, device_id: 'device-01' }]);
  });

  it('integra AuthStore con servicio de autenticacion, perfil y localStorage durante el registro', async () => {
    const authService = {
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      signUp: vi.fn().mockResolvedValue(
        new UserEntity('user-2', 'new@example.com', 'authenticated', false, null)
      ),
      getSessionToken: vi.fn().mockResolvedValue('session-token-2')
    };
    const profileService = {
      createProfile: vi.fn().mockResolvedValue({})
    };
    const useAuthStore = setupAuthStore(authService, profileService);
    const store = useAuthStore();

    await store.signUp('new@example.com', 'StrongPass1!');

    expect(authService.signUp).toHaveBeenCalledWith('new@example.com', 'StrongPass1!');
    expect(profileService.createProfile).toHaveBeenCalledWith('user-2');
    expect(authService.getSessionToken).toHaveBeenCalled();
    expect(store.user?.email).toBe('new@example.com');
    expect(store.token).toBe('session-token-2');
    expect(localStorage.getItem('token')).toBe('session-token-2');
    expect(localStorage.getItem('userUuid')).toBe('user-2');
  });
});

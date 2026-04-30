import { supabase } from '../../utils/supabase';
import type {
	UserProfile,
	ProfileUpdateRequest,
	AvatarUploadResponse,
	UserStats,
	AchievementsResponse,
} from '../model/profile.entity';

type AuthenticatedUser = {
	id: string;
	email?: string;
	created_at: string;
};

type ProfileRow = {
	full_name?: string | null;
	phone?: string | null;
	bio?: string | null;
	location?: string | null;
	avatar_url?: string | null;
	join_date?: string | null;
};

type ProfilePersistence = {
	full_name?: string;
	phone?: string;
	bio?: string;
	location?: string;
};

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const AVATAR_EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
};

class ProfileService {
	private async getAuthenticatedUser(): Promise<AuthenticatedUser> {
		const { data: { user }, error } = await supabase.auth.getUser();
		if (error || !user) throw new Error('User not authenticated');
		return user;
	}

	private async getUserId(): Promise<string> {
		const user = await this.getAuthenticatedUser();
		return user.id;
	}

	async getProfile(): Promise<UserProfile> {
		const user = await this.getAuthenticatedUser();
		
		// Get profile details
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.maybeSingle();

		if (error) {
			throw error;
		}

		const profileData = (data || {}) as ProfileRow;
		
		// Calculate stats from actual data
		const stats = await this.calculateStats(user.id);

		return {
			email: user.email || '',
			username: user.email?.split('@')[0] || 'user',
			fullName: profileData.full_name || '',
			phone: profileData.phone || '',
			bio: profileData.bio || '',
			location: profileData.location || '',
			avatarUrl: profileData.avatar_url || '',
			joinDate: profileData.join_date || user.created_at,
			stats: stats
		};
	}

	private async calculateStats(userId: string): Promise<UserStats> {
		try {
			// Count total plants
			const { data: plants, error: plantsError } = await supabase
				.from('plants')
				.select('id, status', { count: 'exact' })
				.eq('user_id', userId);

			if (plantsError) throw plantsError;
			const totalPlants = plants?.length || 0;

			if (totalPlants === 0) {
				return { totalPlants: 0, wateringSessions: 0, successRate: 100 };
			}

			// Count watering logs (sessions)
			const { count: wateringSessions, error: logsError } = await supabase
				.from('watering_logs')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', userId);

			if (logsError) throw logsError;

			// Calculate success rate: percentage of plants in healthy status
			let successRate = 100;
			if (plants && plants.length > 0) {
				const healthyCount = plants.filter(p => p.status === 'healthy').length;
				successRate = Math.round((healthyCount / plants.length) * 100);
			}

			return {
				totalPlants,
				wateringSessions: wateringSessions || 0,
				successRate
			};
		} catch {
			return { totalPlants: 0, wateringSessions: 0, successRate: 100 };
		}
	}

	async updateProfile(data: ProfileUpdateRequest): Promise<UserProfile> {
		const userId = await this.getUserId();
		
		const updateData = toPersistence(data);

		const { error } = await supabase
			.from('profiles')
			.upsert({ id: userId, ...updateData });

		if (error) throw error;
		
		return this.getProfile();
	}

	async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
		const userId = await this.getUserId();
		const fileExt = validateAvatar(file);
		const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
		
		// Note: Requires a storage bucket named 'avatars'
		const { error: uploadError } = await supabase.storage
			.from(AVATAR_BUCKET)
			.upload(filePath, file);

		if (uploadError) throw uploadError;

		const { data: { publicUrl } } = supabase.storage
			.from(AVATAR_BUCKET)
			.getPublicUrl(filePath);
		
		const { error: updateError } = await supabase
			.from('profiles')
			.upsert({ id: userId, avatar_url: publicUrl });
			
		if (updateError) throw updateError;

		return { avatarUrl: publicUrl };
	}

	async getStats(): Promise<UserStats> {
		const userId = await this.getUserId();
		return this.calculateStats(userId);
	}

	async getAchievements(): Promise<AchievementsResponse> {
		// Mock achievements since there's no table for it yet
		return {
			achievements: [
				{
					id: '1',
					title: 'First Plant',
					description: 'Added your first plant to the app',
					icon: 'pi pi-star',
					earnedDate: new Date().toISOString(),
					status: 'unlocked'
				}
			]
		};
	}

	async createProfile(userId: string): Promise<UserProfile> {
		const newProfileData = {
			id: userId,
			full_name: null,
			phone: null,
			bio: null,
			location: null,
			avatar_url: null,
			join_date: new Date().toISOString(),
			stats: {
				successRate: 100,
				totalPlants: 0,
				wateringSessions: 0
			}
		};

		const { error } = await supabase
			.from('profiles')
			.insert([newProfileData]);

		if (error && error.code !== '23505') { // 23505 is duplicate key error, which is fine if profile already exists
			throw error;
		}

		// Return the created profile
		return {
			email: '',
			username: `user_${userId.substring(0, 8)}`,
			fullName: '',
			phone: '',
			bio: '',
			location: '',
			avatarUrl: '',
			joinDate: newProfileData.join_date,
			stats: newProfileData.stats as UserStats
		};
	}
}

export const profileService = new ProfileService();

function toPersistence(data: ProfileUpdateRequest): ProfilePersistence {
	const updateData: ProfilePersistence = {};
	if (data.fullName !== undefined) updateData.full_name = data.fullName.trim();
	if (data.phone !== undefined) updateData.phone = data.phone.trim();
	if (data.bio !== undefined) updateData.bio = data.bio.trim();
	if (data.location !== undefined) updateData.location = data.location.trim();
	return updateData;
}

function validateAvatar(file: File): string {
	const extension = AVATAR_EXTENSIONS[file.type];
	if (!extension) {
		throw new Error('Unsupported avatar file type');
	}

	if (file.size > MAX_AVATAR_SIZE_BYTES) {
		throw new Error('Avatar file is too large');
	}

	return extension;
}

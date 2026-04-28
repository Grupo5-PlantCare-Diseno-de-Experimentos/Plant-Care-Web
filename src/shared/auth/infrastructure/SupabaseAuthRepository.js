import { supabase } from '@/shared/infrastructure/supabase.js'

export class SupabaseAuthRepository {

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    if (error) throw error
    return data
  }

  async register(email, password) {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password 
    })
    if (error) throw error
    return data
  }

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  }

}
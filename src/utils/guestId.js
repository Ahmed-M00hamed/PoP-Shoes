import { supabase } from '../supabaseClient'

export async function getGuestId() {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
        return session.user.id
    }

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error

    return data.user.id
}

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ProtectedRoute({ children }) {
    const [session, setSession] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        async function checkAdmin() {
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (!session) {
                if (mounted) {
                    setSession(null)
                    setIsAdmin(false)
                    setLoading(false)
                }
                return
            }

            if (mounted) {
                setSession(session)
            }

            const { data, error } = await supabase.rpc('is_admin')

            if (!mounted) return

            if (error) {
                console.error('Admin verification error:', error)
                setIsAdmin(false)
            } else {
                setIsAdmin(data === true)
            }

            setLoading(false)
        }

        checkAdmin()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            checkAdmin()
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <p className="text-white">Verifying admin...</p>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/admin/login" replace />
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />
    }

    return children
}

export default ProtectedRoute

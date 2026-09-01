import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function AdminLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError('Incorrect email or password')
            setLoading(false)
            return
        }

        navigate('/admin')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <form
                onSubmit={handleSubmit}
                className="bg-gray-800 p-8 rounded-lg w-full max-w-sm space-y-5"
            >
                <h1 className="text-2xl font-bold text-white text-center">Register the admin password</h1>

                <div>
                    <label className="block text-white mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                        required
                    />
                </div>

                <div>
                    <label className="block text-white mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                        required
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 cursor-pointer"
                >
                    {loading ? 'Logging in...' : 'entrance'}
                </button>
            </form>
        </div>
    )
}

export default AdminLogin
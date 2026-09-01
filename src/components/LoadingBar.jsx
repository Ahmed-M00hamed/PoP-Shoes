import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

function LoadingBar() {
    const location = useLocation()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        const timer = setTimeout(() => {
            setLoading(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [location.pathname])

    if (!loading) return null

    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-[60]">
            <div className="h-full bg-red-600 animate-loading-bar"></div>
        </div>
    )
}

export default LoadingBar
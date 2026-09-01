import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { getGuestId } from '../utils/guestId'

const statusLabels = {
    pending: 'قيد الانتظار',
    processing: 'جاري التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
}

const statusColors = {
    pending: 'bg-yellow-600',
    processing: 'bg-blue-600',
    shipped: 'bg-purple-600',
    delivered: 'bg-green-600',
    cancelled: 'bg-red-600',
}

function MyOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true)
            const guestId = await getGuestId()

            const { data, error } = await supabase.rpc('get_orders_by_guest', {
                p_guest_id: guestId,
            })

            if (!error) setOrders(data || [])
            setLoading(false)
        }

        fetchOrders()
    }, [])

    return (
        <div className="bg-center bg-cover bg-no-repeat min-h-screen" style={{ backgroundImage: `url(/background.png)` }}>
            <div className="container mx-auto py-20">
                <h1 className="text-3xl font-bold mb-8 text-white">طلباتي</h1>

                {loading ? (
                    <p className="text-white">جاري التحميل...</p>
                ) : orders.length === 0 ? (
                    <div className="text-center mt-20">
                        <p className="text-white/80 mb-4">لسه معملتش أي طلب</p>
                        <Link to="/products" className="text-red-500 underline">
                            تصفح المنتجات
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-3xl">
                        {orders.map((order) => (
                            <Link
                                key={order.id}
                                to={`/order/${order.id}`}
                                className="block bg-black/30 border border-white/20 rounded-lg p-5 hover:bg-black/40 transition"
                            >
                                <div className="flex flex-wrap justify-between items-center gap-3">
                                    <div>
                                        <p className="text-white/60 text-sm">
                                            {new Date(order.created_at).toLocaleDateString('ar-EG')}
                                        </p>
                                        <p className="text-white font-semibold">
                                            {(order.items || []).length} منتج
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-bold">
                                            {Number(order.total).toLocaleString()} جنيه
                                        </span>
                                        <span
                                            className={`text-white text-xs px-3 py-1 rounded-full ${statusColors[order.status]}`}
                                        >
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyOrders
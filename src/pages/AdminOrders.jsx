
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

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

function AdminOrders() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState(null)
    const [filterStatus, setFilterStatus] = useState('all')

    const fetchOrders = async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error) {
            setOrders(data || [])
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    const updateStatus = async (orderId, newStatus) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)

        if (!error) {
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId
                        ? { ...o, status: newStatus }
                        : o
                )
            )
        }
    }

    const filteredOrders =
        filterStatus === 'all'
            ? orders
            : orders.filter((o) => o.status === filterStatus)

    return (
        <div
            dir="rtl"
            className="min-h-screen bg-gray-900 px-6 py-20"
        >
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">
                        لوحة تحكم الطلبات
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="text-red-500 underline cursor-pointer"
                    >
                        تسجيل خروج
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-white cursor-pointer"
                    >
                        المنتجات
                    </button>

                    <button
                        className="px-4 py-2 rounded-lg bg-red-700 text-white cursor-pointer"
                    >
                        الطلبات
                    </button>

                    <button
                        onClick={() => navigate('/admin/sales')}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-white cursor-pointer hover:bg-gray-600 transition"
                    >
                        المبيعات
                    </button>
                </div>

                {/* Status Filters */}
                <div className="flex gap-2 mb-6 flex-wrap">

                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1 rounded-lg text-sm cursor-pointer ${
                            filterStatus === 'all'
                                ? 'bg-white text-gray-900'
                                : 'bg-gray-700 text-white'
                        }`}
                    >
                        الكل ({orders.length})
                    </button>

                    {Object.keys(statusLabels).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1 rounded-lg text-sm cursor-pointer ${
                                filterStatus === status
                                    ? 'bg-white text-gray-900'
                                    : 'bg-gray-700 text-white'
                            }`}
                        >
                            {statusLabels[status]} (
                            {orders.filter(
                                (o) => o.status === status
                            ).length}
                            )
                        </button>
                    ))}

                </div>

                {/* Loading */}
                {loading ? (
                    <p className="text-white">
                        جاري التحميل...
                    </p>
                ) : filteredOrders.length === 0 ? (
                    <p className="text-white/70">
                        لا توجد طلبات حالياً
                    </p>
                ) : (

                    <div className="space-y-4">

                        {filteredOrders.map((order) => (

                            <div
                                key={order.id}
                                className="bg-gray-800 rounded-lg p-5"
                            >

                                {/* Order Header */}
                                <div
                                    className="flex flex-wrap justify-between items-center gap-3 cursor-pointer"
                                    onClick={() =>
                                        setExpandedId(
                                            expandedId === order.id
                                                ? null
                                                : order.id
                                        )
                                    }
                                >

                                    <div>
                                        <p className="text-white font-semibold">
                                            {order.customer_name}
                                        </p>

                                        <p className="text-white/60 text-sm">
                                            {order.phone}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">

                                        <span className="text-white font-bold">
                                            {Number(
                                                order.total
                                            ).toLocaleString()} جنيه
                                        </span>

                                        <span
                                            className={`text-white text-xs px-3 py-1 rounded-full ${
                                                statusColors[
                                                    order.status
                                                ]
                                            }`}
                                        >
                                            {statusLabels[
                                                order.status
                                            ] || order.status}
                                        </span>

                                        <span className="text-white/50 text-sm">
                                            {new Date(
                                                order.created_at
                                            ).toLocaleDateString(
                                                'ar-EG'
                                            )}
                                        </span>

                                    </div>
                                </div>

                                {/* Order Details */}
                                {expandedId === order.id && (

                                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">

                                        {/* Customer Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                            {/* Governorate */}
                                            <div>
                                                <p className="text-white/70 text-sm mb-1">
                                                    المحافظة
                                                </p>

                                                <p className="text-white">
                                                    {order.governorate || 'غير محدد'}
                                                </p>
                                            </div>

                                            {/* Address */}
                                            <div>
                                                <p className="text-white/70 text-sm mb-1">
                                                    العنوان
                                                </p>

                                                <p className="text-white">
                                                    {order.address || 'غير محدد'}
                                                </p>
                                            </div>

                                        </div>

                                        {/* Shipping Cost */}
                                        <div>
                                            <p className="text-white/70 text-sm mb-1">
                                                تكلفة الشحن
                                            </p>

                                            <p className="text-white font-semibold">
                                                {Number(
                                                    order.shipping_cost || 0
                                                ).toLocaleString()} جنيه
                                            </p>
                                        </div>

                                        {/* Products */}
                                        <div>
                                            <p className="text-white/70 text-sm mb-2">
                                                المنتجات المطلوبة
                                            </p>

                                            <div className="space-y-2">

                                                {(order.items || []).map(
                                                    (item, idx) => (

                                                        <div
                                                            key={idx}
                                                            className="flex justify-between text-white bg-gray-700 rounded-lg px-4 py-2 text-sm"
                                                        >

                                                            <span>
                                                                {item.name}

                                                                {item.color &&
                                                                    ` — اللون: ${item.color}`}

                                                                {item.size_eu &&
                                                                    ` — مقاس EU ${item.size_eu}`}

                                                                {item.size_us &&
                                                                    ` / US ${item.size_us}`}

                                                                {' × '}

                                                                {item.quantity}
                                                            </span>

                                                            <span>
                                                                {(
                                                                    Number(
                                                                        item.price
                                                                    ) *
                                                                    Number(
                                                                        item.quantity
                                                                    )
                                                                ).toLocaleString()} جنيه
                                                            </span>

                                                        </div>

                                                    )
                                                )}

                                            </div>
                                        </div>

                                        {/* Cancellation Reason */}
                                        {order.status === 'cancelled' &&
                                            order.cancellation_reason && (
                                                <div>
                                                    <p className="text-white/70 text-sm mb-1">
                                                        سبب الإلغاء
                                                    </p>

                                                    <p className="text-red-400">
                                                        {order.cancellation_reason}
                                                    </p>
                                                </div>
                                            )}

                                        {/* Update Status */}
                                        <div>
                                            <p className="text-white/70 text-sm mb-2">
                                                تحديث حالة الطلب
                                            </p>

                                            <div className="flex gap-2 flex-wrap">

                                                {Object.keys(statusLabels).map(
                                                    (status) => (

                                                        <button
                                                            key={status}
                                                            onClick={() =>
                                                                updateStatus(
                                                                    order.id,
                                                                    status
                                                                )
                                                            }
                                                            className={`px-3 py-1 rounded-lg text-sm cursor-pointer ${
                                                                order.status ===
                                                                status
                                                                    ? `${statusColors[status]} text-white`
                                                                    : 'bg-gray-700 text-white/70'
                                                            }`}
                                                        >
                                                            {
                                                                statusLabels[
                                                                    status
                                                                ]
                                                            }
                                                        </button>

                                                    )
                                                )}

                                            </div>
                                        </div>

                                    </div>
                                )}

                            </div>

                        ))}

                    </div>

                )}

            </div>
        </div>
    )
}

export default AdminOrders


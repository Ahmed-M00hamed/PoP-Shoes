import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const steps = ['pending', 'processing', 'shipped', 'delivered']

const statusLabels = {
    pending: 'قيد الانتظار',
    processing: 'جاري التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
}

function OrderTracking() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true)
            const { data, error } = await supabase.rpc('get_order_by_id', { order_id: id })

            if (error || !data || data.length === 0) {
                setError('لم يتم العثور على الطلب')
            } else {
                setOrder(data[0])
            }
            setLoading(false)
        }

        fetchOrder()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <p className="text-white">جاري التحميل...</p>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
                <p className="text-red-500">{error}</p>
                <Link to="/" className="text-white underline">
                    العودة للرئيسية
                </Link>
            </div>
        )
    }

    const currentStepIndex = steps.indexOf(order.status)
    const isCancelled = order.status === 'cancelled'

    return (
        <div className="min-h-screen bg-gray-900 px-6 py-20">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-2">تتبع الطلب</h1>
                <p className="text-white/60 mb-8">رقم الطلب: {order.id.slice(0, 8)}...</p>

                {isCancelled ? (
                    <div className="bg-red-900/40 border border-red-600 rounded-lg p-6 text-center mb-8">
                        <p className="text-red-400 font-bold text-lg">تم إلغاء هذا الطلب</p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between mb-10">
                        {steps.map((step, idx) => (
                            <div key={step} className="flex-1 flex flex-col items-center relative">
                                {idx !== 0 && (
                                    <div
                                        className={`absolute top-4 right-1/2 w-full h-1 -z-10 ${idx <= currentStepIndex ? 'bg-red-600' : 'bg-gray-700'
                                            }`}
                                    ></div>
                                )}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx <= currentStepIndex ? 'bg-red-600 text-white' : 'bg-gray-700 text-white/50'
                                        }`}
                                >
                                    {idx + 1}
                                </div>
                                <p
                                    className={`text-xs mt-2 text-center ${idx <= currentStepIndex ? 'text-white' : 'text-white/40'
                                        }`}
                                >
                                    {statusLabels[step]}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                    <div>
                        <p className="text-white/60 text-sm">الاسم</p>
                        <p className="text-white">{order.customer_name}</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">العنوان</p>
                        <p className="text-white">{order.address}</p>
                    </div>

                    <div>
                        <p className="text-white/60 text-sm mb-2">المنتجات</p>
                        <div className="space-y-2">
                            {(order.items || []).map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex justify-between text-white bg-gray-700 rounded-lg px-4 py-2 text-sm"
                                >
                                    <span>
                                        {item.name}
                                        {item.color && ` — ${item.color}`}
                                        {item.size_eu && ` — EU ${item.size_eu}`}
                                        {' × '}
                                        {item.quantity}
                                    </span>
                                    <span>{(item.price * item.quantity).toLocaleString()} جنيه</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between font-bold text-lg border-t border-gray-700 pt-4 text-white">
                        <span>الإجمالي</span>
                        <span>{Number(order.total).toLocaleString()} جنيه</span>
                    </div>
                </div>

                <Link
                    to="/products"
                    className="block text-center bg-red-700 text-white py-3 rounded-lg hover:bg-red-600 transition duration-300 mt-6"
                >
                    كمّل تسوق
                </Link>
            </div>
        </div>
    )
}

export default OrderTracking
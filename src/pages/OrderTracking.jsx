
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { getGuestId } from '../utils/guestId'

const steps = ['pending', 'processing', 'shipped', 'delivered']

const statusLabels = {
    pending: 'قيد الانتظار',
    processing: 'جاري التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
}

const cancelReasons = [
    'غيرت رأيي',
    'وجدت سعر أفضل',
    'أريد تغيير المنتجات',
    'أريد تغيير العنوان',
    'تأخر الطلب',
]

function OrderTracking() {
    const { id } = useParams()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [showCancel, setShowCancel] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [otherReason, setOtherReason] = useState('')
    const [cancelling, setCancelling] = useState(false)
    const [cancelError, setCancelError] = useState(null)

    // =========================
    // جلب الطلب
    // =========================
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true)
                setError(null)

                await getGuestId()

                const { data, error } = await supabase.rpc(
                    'get_order_by_id',
                    {
                        order_id: id,
                    }
                )

                if (error) {
                    console.error('GET ORDER ERROR:', error)
                    setError('حدث خطأ أثناء تحميل الطلب')
                    return
                }

                if (!data || data.length === 0) {
                    setError('لم يتم العثور على الطلب')
                    return
                }

                setOrder(data[0])
            } catch (err) {
                console.error('FETCH ORDER ERROR:', err)
                setError('حدث خطأ أثناء تحميل الطلب')
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [id])

    // =========================
    // إلغاء الطلب
    // =========================
    const handleCancelOrder = async () => {
        const finalReason =
            cancelReason === 'سبب آخر'
                ? otherReason.trim()
                : cancelReason

        if (!finalReason) {
            setCancelError('من فضلك اختر سبب إلغاء الطلب')
            return
        }

        if (
            cancelReason === 'سبب آخر' &&
            !otherReason.trim()
        ) {
            setCancelError('من فضلك اكتب سبب الإلغاء')
            return
        }

        setCancelling(true)
        setCancelError(null)

        try {
            const guestId = await getGuestId()

            const { data, error } = await supabase.rpc(
                'cancel_order',
                {
                    p_order_id: order.id,
                    p_guest_id: guestId,
                    p_reason: finalReason,
                }
            )

            if (error) {
                console.error('CANCEL ORDER ERROR:', error)

                if (
                    error.message?.includes(
                        'ORDER_NOT_FOUND'
                    )
                ) {
                    setCancelError(
                        'مش قادرين نلغي الطلب. تأكد إن الطلب تابع ليك.'
                    )
                } else if (
                    error.message?.includes(
                        'ORDER_CANNOT_BE_CANCELLED'
                    )
                ) {
                    setCancelError(
                        'الطلب لم يعد قابلًا للإلغاء لأن حالته اتغيرت.'
                    )
                } else if (
                    error.message?.includes(
                        'CANCELLATION_REASON_REQUIRED'
                    )
                ) {
                    setCancelError(
                        'من فضلك اختر سبب إلغاء الطلب.'
                    )
                } else {
                    setCancelError(
                        'مقدرناش نلغي الطلب. حاول مرة تانية.'
                    )
                }

                return
            }

            if (!data || data.length === 0) {
                setCancelError(
                    'مقدرناش نلغي الطلب. حاول مرة تانية.'
                )
                return
            }

            setOrder(data[0])

            setShowCancel(false)
            setCancelReason('')
            setOtherReason('')
            setCancelError(null)
        } catch (err) {
            console.error(
                'CANCEL ORDER EXCEPTION:',
                err
            )

            setCancelError(
                'حدث خطأ أثناء إلغاء الطلب. حاول مرة تانية.'
            )
        } finally {
            setCancelling(false)
        }
    }

    // =========================
    // Loading
    // =========================
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <p className="text-white">
                    جاري التحميل...
                </p>
            </div>
        )
    }

    // =========================
    // Error
    // =========================
    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-red-500">
                    {error}
                </p>

                <Link
                    to="/"
                    className="text-white underline"
                >
                    العودة للرئيسية
                </Link>
            </div>
        )
    }

    const currentStepIndex = steps.indexOf(
        order.status
    )

    const isCancelled =
        order.status === 'cancelled'

    const canCancel =
        order.status === 'pending' ||
        order.status === 'processing'

    // =========================
    // حساب إجمالي المنتجات
    // =========================
    const productsTotal = (
        order.items || []
    ).reduce(
        (sum, item) =>
            sum +
            Number(item.price) *
            Number(item.quantity),
        0
    )

    const shippingCost = Number(
        order.shipping_cost || 0
    )

    // =========================
    // الصفحة
    // =========================
    return (
        <div className="min-h-screen bg-gray-900 px-4 md:px-6 py-20">
            <div className="max-w-2xl mx-auto">

                {/* العنوان */}
                <h1 className="text-2xl font-bold text-white mb-2">
                    تتبع الطلب
                </h1>

                <p className="text-white/60 mb-8">
                    رقم الطلب:{' '}
                    {order.id.slice(0, 8)}...
                </p>

                {/* ========================= */}
                {/* حالة الطلب */}
                {/* ========================= */}

                {isCancelled ? (
                    <div className="bg-red-900/40 border border-red-600 rounded-lg p-6 text-center mb-8">

                        <p className="text-red-400 font-bold text-lg">
                            تم إلغاء هذا الطلب
                        </p>

                        {order.cancellation_reason && (
                            <p className="text-white/70 text-sm mt-2">
                                سبب الإلغاء:{' '}
                                {order.cancellation_reason}
                            </p>
                        )}

                    </div>
                ) : (
                    <div className="flex items-center justify-between mb-10">

                        {steps.map(
                            (step, idx) => (
                                <div
                                    key={step}
                                    className="flex-1 flex flex-col items-center relative"
                                >

                                    {/* الخط بين المراحل */}
                                    {idx !== 0 && (
                                        <div
                                            className={`absolute top-4 right-1/2 w-full h-1 -z-10 ${idx <=
                                                    currentStepIndex
                                                    ? 'bg-red-600'
                                                    : 'bg-gray-700'
                                                }`}
                                        />
                                    )}

                                    {/* الدائرة */}
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx <=
                                                currentStepIndex
                                                ? 'bg-red-600 text-white'
                                                : 'bg-gray-700 text-white/50'
                                            }`}
                                    >
                                        {idx + 1}
                                    </div>

                                    {/* اسم المرحلة */}
                                    <p
                                        className={`text-xs mt-2 text-center ${idx <=
                                                currentStepIndex
                                                ? 'text-white'
                                                : 'text-white/40'
                                            }`}
                                    >
                                        {
                                            statusLabels[
                                            step
                                            ]
                                        }
                                    </p>

                                </div>
                            )
                        )}

                    </div>
                )}

                {/* ========================= */}
                {/* بيانات الطلب */}
                {/* ========================= */}

                <div className="bg-gray-800 rounded-lg p-6 space-y-5">

                    <h2 className="text-xl font-bold text-white">
                        بيانات الطلب
                    </h2>

                    {/* الاسم */}
                    <div>
                        <p className="text-white/60 text-sm">
                            الاسم
                        </p>

                        <p className="text-white">
                            {order.customer_name}
                        </p>
                    </div>

                    {/* رقم التليفون */}
                    {order.phone && (
                        <div>
                            <p className="text-white/60 text-sm">
                                رقم التليفون
                            </p>

                            <p className="text-white">
                                {order.phone}
                            </p>
                        </div>
                    )}

                    {/* المحافظة */}
                    {order.governorate && (
                        <div>
                            <p className="text-white/60 text-sm">
                                المحافظة
                            </p>

                            <p className="text-white">
                                {order.governorate}
                            </p>
                        </div>
                    )}

                    {/* العنوان */}
                    <div>
                        <p className="text-white/60 text-sm">
                            العنوان
                        </p>

                        <p className="text-white">
                            {order.address}
                        </p>
                    </div>

                    {/* ========================= */}
                    {/* المنتجات */}
                    {/* ========================= */}

                    <div>
                        <p className="text-white/60 text-sm mb-2">
                            المنتجات
                        </p>

                        <div className="space-y-2">

                            {(order.items || []).map(
                                (item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex justify-between gap-4 text-white bg-gray-700 rounded-lg px-4 py-3 text-sm"
                                    >

                                        <span>
                                            {item.name}

                                            {item.color &&
                                                ` — ${item.color}`}

                                            {item.size_eu &&
                                                ` — EU ${item.size_eu}`}

                                            {' × '}

                                            {item.quantity}
                                        </span>

                                        <span className="whitespace-nowrap">
                                            {(
                                                Number(
                                                    item.price
                                                ) *
                                                Number(
                                                    item.quantity
                                                )
                                            ).toLocaleString()}{' '}
                                            جنيه
                                        </span>

                                    </div>
                                )
                            )}

                        </div>
                    </div>

                    {/* ========================= */}
                    {/* إجمالي المنتجات */}
                    {/* ========================= */}

                    <div className="flex justify-between text-white/70 border-t border-gray-700 pt-4">
                        <span>
                            المنتجات
                        </span>

                        <span>
                            {productsTotal.toLocaleString()}{' '}
                            جنيه
                        </span>
                    </div>

                    {/* ========================= */}
                    {/* الشحن */}
                    {/* ========================= */}

                    <div className="flex justify-between text-white/70">
                        <span>
                            الشحن
                        </span>

                        <span>
                            {shippingCost.toLocaleString()}{' '}
                            جنيه
                        </span>
                    </div>

                    {/* ========================= */}
                    {/* الإجمالي */}
                    {/* ========================= */}

                    <div className="flex justify-between font-bold text-lg border-t border-gray-700 pt-4 text-white">
                        <span>
                            الإجمالي
                        </span>

                        <span>
                            {Number(
                                order.total
                            ).toLocaleString()}{' '}
                            جنيه
                        </span>
                    </div>

                </div>

                {/* ========================= */}
                {/* زر إلغاء الطلب */}
                {/* ========================= */}

                {canCancel &&
                    !showCancel && (
                        <button
                            onClick={() => {
                                setShowCancel(true)
                                setCancelError(null)
                            }}
                            className="w-full mt-6 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white py-3 rounded-lg transition duration-300 cursor-pointer"
                        >
                            إلغاء الطلب
                        </button>
                    )}

                {/* ========================= */}
                {/* نموذج الإلغاء */}
                {/* ========================= */}

                {canCancel &&
                    showCancel && (
                        <div className="bg-gray-800 rounded-lg p-6 mt-6 border border-red-600">

                            <h2 className="text-xl font-bold text-white mb-2">
                                لماذا تريد إلغاء الطلب؟
                            </h2>

                            <p className="text-white/60 text-sm mb-5">
                                اختر السبب المناسب لإلغاء طلبك.
                            </p>

                            <div className="space-y-3">

                                {/* أسباب الإلغاء */}
                                {cancelReasons.map(
                                    (reason) => (
                                        <label
                                            key={reason}
                                            className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer"
                                        >

                                            <input
                                                type="radio"
                                                name="cancelReason"
                                                value={
                                                    reason
                                                }
                                                checked={
                                                    cancelReason ===
                                                    reason
                                                }
                                                onChange={(
                                                    e
                                                ) => {
                                                    setCancelReason(
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                    setCancelError(
                                                        null
                                                    )
                                                }}
                                                className="accent-red-600"
                                            />

                                            <span className="text-white text-sm">
                                                {
                                                    reason
                                                }
                                            </span>

                                        </label>
                                    )
                                )}

                                {/* سبب آخر */}
                                <label className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer">

                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value="سبب آخر"
                                        checked={
                                            cancelReason ===
                                            'سبب آخر'
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            setCancelReason(
                                                e
                                                    .target
                                                    .value
                                            )
                                            setCancelError(
                                                null
                                            )
                                        }}
                                        className="accent-red-600"
                                    />

                                    <span className="text-white text-sm">
                                        سبب آخر
                                    </span>

                                </label>

                            </div>

                            {/* كتابة السبب الآخر */}
                            {cancelReason ===
                                'سبب آخر' && (
                                    <textarea
                                        value={
                                            otherReason
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            setOtherReason(
                                                e.target
                                                    .value
                                            )
                                            setCancelError(
                                                null
                                            )
                                        }}
                                        rows={4}
                                        placeholder="اكتب سبب إلغاء الطلب..."
                                        className="w-full mt-4 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                                    />
                                )}

                            {/* رسالة الخطأ */}
                            {cancelError && (
                                <p className="text-red-500 text-sm mt-4">
                                    {cancelError}
                                </p>
                            )}

                            {/* الأزرار */}
                            <div className="flex gap-3 mt-5">

                                <button
                                    onClick={
                                        handleCancelOrder
                                    }
                                    disabled={
                                        cancelling
                                    }
                                    className="flex-1 bg-red-700 hover:bg-red-600 text-white py-3 rounded-lg transition duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {cancelling
                                        ? 'جاري الإلغاء...'
                                        : 'تأكيد إلغاء الطلب'}
                                </button>

                                <button
                                    onClick={() => {
                                        setShowCancel(
                                            false
                                        )
                                        setCancelError(
                                            null
                                        )
                                    }}
                                    disabled={
                                        cancelling
                                    }
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition duration-300 cursor-pointer disabled:opacity-50"
                                >
                                    رجوع
                                </button>

                            </div>

                        </div>
                    )}

                {/* ========================= */}
                {/* التسوق */}
                {/* ========================= */}

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

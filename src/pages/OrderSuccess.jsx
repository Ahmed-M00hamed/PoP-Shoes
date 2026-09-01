import { Link, useLocation } from 'react-router-dom'

function OrderSuccess() {
    const location = useLocation()
    const orderId = location.state?.orderId

    const trackingUrl = orderId ? `${window.location.origin}/order/${orderId}` : null

    const copyLink = () => {
        navigator.clipboard.writeText(trackingUrl)
        alert('تم نسخ رابط التتبع')
    }

    return (
        <div
            className="bg-center bg-cover bg-no-repeat min-h-screen flex items-center justify-center"
            style={{ backgroundImage: `url(/background.png)` }}
        >
            <div className="text-center bg-black/40 rounded-lg p-10 max-w-md">
                <div className="text-6xl mb-4">✓</div>
                <h1 className="text-2xl font-bold text-white mb-2">تم إرسال طلبك بنجاح</h1>
                <p className="text-white/70 mb-6">هيتم التواصل معاك قريباً لتأكيد الطلب والتوصيل</p>

                {trackingUrl && (
                    <div className="bg-white/10 rounded-lg p-4 mb-6">
                        <p className="text-white/70 text-sm mb-2">احتفظ بالرابط ده عشان تتابع حالة طلبك</p>
                        <div className="flex gap-2">
                            <Link
                                to={`/order/${orderId}`}
                                className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded truncate"
                            >
                                تتبع الطلب
                            </Link>
                            <button
                                onClick={copyLink}
                                className="bg-red-700 text-white text-sm px-4 py-2 rounded cursor-pointer"
                            >
                                نسخ الرابط
                            </button>
                        </div>
                    </div>
                )}

                <Link
                    to="/products"
                    className="inline-block bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition duration-300"
                >
                    كمّل تسوق
                </Link>
            </div>
        </div>
    )
}

export default OrderSuccess
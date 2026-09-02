import { Link, useLocation } from 'react-router-dom'

function OrderSuccess() {
    const location = useLocation()
    const orderId = location.state?.orderId

    const trackingUrl = orderId
        ? `${window.location.origin}/order/${orderId}`
        : null

    const copyLink = async () => {
        if (!trackingUrl) return

        try {
            await navigator.clipboard.writeText(trackingUrl)
            alert('تم نسخ رابط التتبع بنجاح')
        } catch (error) {
            alert('حصل خطأ أثناء نسخ الرابط')
        }
    }

    return (
        <div
            className="bg-center bg-cover bg-no-repeat min-h-screen flex items-center justify-center px-4"
            style={{
                backgroundImage: `url(/background.png)`,
            }}
        >
            <div className="w-full max-w-lg text-center bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">

                {/* علامة النجاح */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                    <span className="text-4xl text-green-400">
                        ✓
                    </span>
                </div>

                {/* العنوان */}
                <h1 className="text-3xl font-bold text-white mb-3">
                    تم إرسال طلبك بنجاح 🎉
                </h1>

                <p className="text-white/70 mb-6 leading-relaxed">
                    شكرًا لطلبك من PoP Shoes ❤️
                    <br />
                    هيتم التواصل معاك قريبًا لتأكيد الطلب والتوصيل.
                </p>

                {/* رقم الطلب */}
                {orderId && (
                    <div className="bg-white/10 border border-white/10 rounded-xl p-4 mb-5">
                        <p className="text-white/60 text-sm mb-1">
                            رقم الطلب
                        </p>

                        <p className="text-white font-bold text-lg break-all">
                            #{orderId}
                        </p>
                    </div>
                )}

                {/* التتبع */}
                {trackingUrl && (
                    <div className="bg-white/10 border border-white/10 rounded-xl p-5 mb-6">

                        <p className="text-white font-semibold mb-2">
                            تابع حالة طلبك 📦
                        </p>

                        <p className="text-white/60 text-sm mb-4">
                            احتفظ برابط التتبع ده عشان تقدر تعرف حالة طلبك في أي وقت.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">

                            <Link
                                to={`/order/${orderId}`}
                                className="flex-1 bg-red-700 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition duration-300 font-medium"
                            >
                                تتبع الطلب
                            </Link>

                            <button
                                onClick={copyLink}
                                className="sm:w-auto bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-3 rounded-lg transition duration-300 cursor-pointer"
                            >
                                نسخ الرابط
                            </button>

                        </div>
                    </div>
                )}

                {/* لو مفيش orderId */}
                {!orderId && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                        <p className="text-yellow-300 text-sm">
                            لم نتمكن من الحصول على رقم الطلب.
                            يمكنك الرجوع للمنتجات ومتابعة التسوق.
                        </p>
                    </div>
                )}

                {/* زر التسوق */}
                <Link
                    to="/products"
                    className="inline-block w-full bg-red-700 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition duration-300 font-semibold"
                >
                    كمّل تسوق 🛍️
                </Link>

            </div>
        </div>
    )
}

export default OrderSuccess
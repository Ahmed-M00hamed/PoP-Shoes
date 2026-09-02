
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { getGuestId } from '../utils/guestId'

function Checkout() {
    const navigate = useNavigate()

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    const [form, setForm] = useState({
        name: '',
        phone: '',
        governorate: '',
        address: '',
    })

    // المحافظات وأسعار الشحن
    const governorates = [
        { name: 'القاهرة', shipping: 60 },
        { name: 'الجيزة', shipping: 60 },
        { name: 'القليوبية', shipping: 60 },
        { name: 'الشرقية', shipping: 60 },

        { name: 'الإسماعيلية', shipping: 70 },
        { name: 'السويس', shipping: 70 },
        { name: 'بورسعيد', shipping: 70 },
        { name: 'دمياط', shipping: 70 },
        { name: 'الدقهلية', shipping: 70 },
        { name: 'الغربية', shipping: 70 },
        { name: 'المنوفية', shipping: 70 },
        { name: 'البحيرة', shipping: 70 },
        { name: 'كفر الشيخ', shipping: 70 },
        { name: 'الإسكندرية', shipping: 70 },

        { name: 'الفيوم', shipping: 80 },
        { name: 'بني سويف', shipping: 80 },
        { name: 'المنيا', shipping: 80 },
        { name: 'أسيوط', shipping: 80 },
        { name: 'سوهاج', shipping: 80 },
        { name: 'قنا', shipping: 80 },
        { name: 'الأقصر', shipping: 80 },
        { name: 'أسوان', shipping: 80 },
        { name: 'البحر الأحمر', shipping: 80 },
        { name: 'الوادي الجديد', shipping: 80 },
        { name: 'مطروح', shipping: 80 },
        { name: 'شمال سيناء', shipping: 80 },
        { name: 'جنوب سيناء', shipping: 80 },
    ]

    useEffect(() => {
        const fetchCart = async () => {
            try {
                setLoading(true)

                const guestId = await getGuestId()

                const { data, error } = await supabase
                    .from('cart_items')
                    .select(
                        `id, quantity,
                        variant:product_variants (
                            id, color, size_eu, size_us, stock,
                            product:products ( id, name, price )
                        )`
                    )
                    .eq('guest_id', guestId)

                if (error) {
                    console.error('FETCH CART ERROR:', error)
                    setError('حصل خطأ أثناء تحميل الكارت')
                    return
                }

                setItems(
                    (data || []).filter(
                        (item) =>
                            item.variant &&
                            item.variant.product
                    )
                )
            } catch (err) {
                console.error('FETCH CART EXCEPTION:', err)
                setError('حصل خطأ أثناء تحميل الكارت')
            } finally {
                setLoading(false)
            }
        }

        fetchCart()
    }, [])

    // إجمالي المنتجات
    const productsTotal = items.reduce(
        (sum, item) =>
            sum +
            Number(item.variant.product.price) *
            Number(item.quantity),
        0
    )

    // المحافظة المختارة
    const selectedGovernorate = governorates.find(
        (gov) => gov.name === form.governorate
    )

    // سعر الشحن
    const shippingCost = selectedGovernorate
        ? selectedGovernorate.shipping
        : 0

    // الإجمالي النهائي
    const total = productsTotal + shippingCost

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })

        setError(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (
            !form.name.trim() ||
            !form.phone.trim() ||
            !form.governorate ||
            !form.address.trim()
        ) {
            setError('من فضلك املأ كل البيانات')
            return
        }

        if (items.length === 0) {
            setError('الكارت فاضي، مفيش حاجة تتطلب')
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            // الحصول على Guest ID
            const guestId = await getGuestId()

            // تجهيز المنتجات
            const orderItems = items.map((item) => ({
                product_id: item.variant.product.id,
                variant_id: item.variant.id,
                name: item.variant.product.name,
                color: item.variant.color,
                size_eu: item.variant.size_eu,
                size_us: item.variant.size_us,
                price: Number(item.variant.product.price),
                quantity: Number(item.quantity),
            }))

            // إنشاء الطلب + خصم المخزون
            // كل ده بيتم داخل Supabase Transaction
            const { data: newOrder, error: orderError } =
                await supabase.rpc(
                    'create_order',
                    {
                        p_guest_id: guestId,
                        p_customer_name: form.name,
                        p_phone: form.phone,
                        p_governorate: form.governorate,
                        p_address: form.address,
                        p_items: orderItems,
                        p_total: total,
                        p_shipping_cost: shippingCost,
                    }
                )

            if (orderError) {
                console.error(
                    'CREATE ORDER ERROR:',
                    orderError
                )

                if (
                    orderError.message?.includes(
                        'INSUFFICIENT_STOCK'
                    )
                ) {
                    setError(
                        'عفواً، الكمية المطلوبة من أحد المنتجات لم تعد متوفرة.'
                    )
                } else if (
                    orderError.message?.includes(
                        'VARIANT_NOT_FOUND'
                    )
                ) {
                    setError(
                        'أحد المنتجات في الكارت لم يعد متاحاً.'
                    )
                } else if (
                    orderError.message?.includes(
                        'INVALID_QUANTITY'
                    )
                ) {
                    setError(
                        'يوجد خطأ في كمية أحد المنتجات.'
                    )
                } else {
                    setError(
                        'حصل خطأ أثناء إرسال الطلب، حاول تاني.'
                    )
                }

                return
            }

            if (!newOrder || newOrder.length === 0) {
                setError(
                    'حصل خطأ أثناء إنشاء الطلب، حاول تاني.'
                )
                return
            }

            const createdOrder = newOrder[0]

            // تفريغ الكارت بعد نجاح إنشاء الطلب
            const { error: cartError } = await supabase
                .from('cart_items')
                .delete()
                .eq('guest_id', guestId)

            if (cartError) {
                console.error(
                    'CLEAR CART ERROR:',
                    cartError
                )
            }

            // الانتقال لصفحة نجاح الطلب
            navigate('/order-success', {
                state: {
                    orderId: createdOrder.id,
                },
            })
        } catch (err) {
            console.error(
                'CHECKOUT EXCEPTION:',
                err
            )

            setError(
                'حدث خطأ أثناء إرسال الطلب، حاول تاني.'
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div
                className="bg-center bg-cover bg-no-repeat min-h-screen"
                style={{
                    backgroundImage: `url(/background.png)`,
                }}
            >
                <div className="container mx-auto py-10">
                    <p className="text-white">
                        جاري التحميل...
                    </p>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div
                className="bg-center bg-cover bg-no-repeat min-h-screen"
                style={{
                    backgroundImage: `url(/background.png)`,
                }}
            >
                <div className="container mx-auto py-20 text-center">
                    <p className="text-white/80 mb-4">
                        الكارت فاضي، مفيش حاجة تتطلب
                    </p>

                    <Link
                        to="/products"
                        className="text-red-500 underline"
                    >
                        تصفح المنتجات
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div
            className="bg-center bg-cover bg-no-repeat min-h-screen"
            style={{
                backgroundImage: `url(/background.png)`,
            }}
        >
            <div className="container mx-auto py-20 px-4">

                <h1 className="text-3xl font-bold mb-8 text-white">
                    إتمام الطلب
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* الفورم */}
                    <form
                        onSubmit={handleSubmit}
                        className="lg:col-span-2 space-y-5"
                    >

                        {/* الاسم */}
                        <div>
                            <label className="block text-white mb-1">
                                الاسم بالكامل
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
                                placeholder="اكتب اسمك"
                            />
                        </div>

                        {/* الهاتف */}
                        <div>
                            <label className="block text-white mb-1">
                                رقم التليفون
                            </label>

                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
                                placeholder="01xxxxxxxxx"
                            />
                        </div>

                        {/* المحافظة */}
                        <div>
                            <label className="block text-white mb-1">
                                المحافظة
                            </label>

                            <select
                                name="governorate"
                                value={form.governorate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-black/80 border border-white/30 text-white focus:outline-none focus:border-red-500"
                            >
                                <option value="">
                                    اختر المحافظة
                                </option>

                                {governorates.map((gov) => (
                                    <option
                                        key={gov.name}
                                        value={gov.name}
                                    >
                                        {gov.name} - شحن{' '}
                                        {gov.shipping} جنيه
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* العنوان */}
                        <div>
                            <label className="block text-white mb-1">
                                العنوان بالتفصيل
                            </label>

                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
                                placeholder="المدينة، الشارع، رقم العقار، الدور، الشقة..."
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
                                <p className="text-red-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? 'جاري إرسال الطلب...'
                                : 'تأكيد الطلب'}
                        </button>

                    </form>

                    {/* ملخص الطلب */}
                    <div className="border border-white/20 bg-black/30 rounded-lg p-6 h-fit space-y-4">

                        <h2 className="text-xl font-bold text-white">
                            ملخص الطلب
                        </h2>

                        {/* المنتجات */}
                        <div className="space-y-3">

                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between gap-4 text-white/80 text-sm"
                                >
                                    <span>
                                        {item.variant.product.name}

                                        {' '}

                                        (
                                        {item.variant.color}

                                        {item.variant.size_eu &&
                                            `, EU ${item.variant.size_eu}`}

                                        )

                                        {' × '}

                                        {item.quantity}
                                    </span>

                                    <span className="whitespace-nowrap">
                                        {(
                                            Number(
                                                item.variant.product.price
                                            ) *
                                            Number(
                                                item.quantity
                                            )
                                        ).toLocaleString()}{' '}
                                        جنيه
                                    </span>
                                </div>
                            ))}

                        </div>

                        {/* سعر المنتجات */}
                        <div className="flex justify-between text-white/80 border-t border-white/20 pt-4">
                            <span>
                                المنتجات
                            </span>

                            <span>
                                {productsTotal.toLocaleString()}{' '}
                                جنيه
                            </span>
                        </div>

                        {/* الشحن */}
                        <div className="flex justify-between text-white/80">
                            <span>
                                الشحن
                            </span>

                            <span>
                                {form.governorate
                                    ? `${shippingCost.toLocaleString()} جنيه`
                                    : 'اختر المحافظة'}
                            </span>
                        </div>

                        {/* الإجمالي النهائي */}
                        <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-4 text-white">
                            <span>
                                الإجمالي
                            </span>

                            <span>
                                {total.toLocaleString()} جنيه
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout

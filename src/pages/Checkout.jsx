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
        address: '',
    })

    useEffect(() => {
        const fetchCart = async () => {
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

            if (!error) {
                setItems((data || []).filter((item) => item.variant && item.variant.product))
            }
            setLoading(false)
        }

        fetchCart()
    }, [])

    const total = items.reduce((sum, item) => sum + item.variant.product.price * item.quantity, 0)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
            setError('من فضلك املأ كل البيانات')
            return
        }

        if (items.length === 0) {
            setError('الكارت فاضي، مفيش حاجة تتطلب')
            return
        }

        setSubmitting(true)
        setError(null)
        const guestId = await getGuestId()

        const orderItems = items.map((item) => ({
            product_id: item.variant.product.id,
            variant_id: item.variant.id,
            name: item.variant.product.name,
            color: item.variant.color,
            size_eu: item.variant.size_eu,
            size_us: item.variant.size_us,
            price: item.variant.product.price,
            quantity: item.quantity,
        }))

        const { data: newOrder, error: insertError } = await supabase
            .from('orders')
            .insert({
                guest_id: guestId,
                customer_name: form.name,
                phone: form.phone,
                address: form.address,
                items: orderItems,
                total,
            })
            .select()
            .single()

        if (insertError) {
            setError('حصل خطأ أثناء إرسال الطلب، حاول تاني')
            setSubmitting(false)
            return
        }

        // نخصم الكمية المطلوبة من مخزون كل variant
        for (const item of items) {
            const newStock = Math.max(0, item.variant.stock - item.quantity)
            await supabase
                .from('product_variants')
                .update({ stock: newStock })
                .eq('id', item.variant.id)
        }

        await supabase.from('cart_items').delete().eq('guest_id', guestId)


        navigate('/order-success', { state: { orderId: newOrder.id } })
    }

    if (loading) {
        return (
            <div className="bg-center bg-cover bg-no-repeat min-h-screen" style={{ backgroundImage: `url(/background.png)` }}>
                <div className="container mx-auto py-10">
                    <p className="text-white">جاري التحميل...</p>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="bg-center bg-cover bg-no-repeat min-h-screen" style={{ backgroundImage: `url(/background.png)` }}>
                <div className="container mx-auto py-20 text-center">
                    <p className="text-white/80 mb-4">الكارت فاضي، مفيش حاجة تتطلب</p>
                    <Link to="/products" className="text-red-500 underline">
                        تصفح المنتجات
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-center bg-cover bg-no-repeat min-h-screen" style={{ backgroundImage: `url(/background.png)` }}>
            <div className="container mx-auto py-20">
                <h1 className="text-3xl font-bold mb-8 text-white">إتمام الطلب</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
                        <div>
                            <label className="block text-white mb-1">الاسم بالكامل</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
                                placeholder="اكتب اسمك"
                            />
                        </div>

                        <div>
                            <label className="block text-white mb-1">رقم التليفون</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
                                placeholder="01xxxxxxxxx"
                            />
                        </div>

                        <div>
                            <label className="block text-white mb-1">العنوان بالتفصيل</label>
                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
                                placeholder="المحافظة، المدينة، الشارع، رقم العقار..."
                            />
                        </div>

                        {error && <p className="text-red-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {submitting ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}
                        </button>
                    </form>

                    <div className="border border-white/20 bg-black/30 rounded-lg p-6 h-fit space-y-4">
                        <h2 className="text-xl font-bold text-white">ملخص الطلب</h2>

                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between text-white/80 text-sm">
                                    <span>
                                        {item.variant.product.name} ({item.variant.color}
                                        {item.variant.size_eu && `, EU ${item.variant.size_eu}`}) × {item.quantity}
                                    </span>
                                    <span>{(item.variant.product.price * item.quantity).toLocaleString()} جنيه</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-4 text-white">
                            <span>الإجمالي</span>
                            <span>{total.toLocaleString()} جنيه</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
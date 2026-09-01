import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { getGuestId } from '../utils/guestId'


function CartSkeleton() {
    return (
        <div className="flex gap-4 border rounded-lg p-4 animate-pulse">
            <div className="bg-gray-300 h-24 w-24 rounded-md"></div>
            <div className="flex-1 space-y-2">
                <div className="bg-gray-300 h-4 w-1/3 rounded"></div>
                <div className="bg-gray-300 h-4 w-1/5 rounded"></div>
            </div>
        </div>
    )
}

function Cart() {

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [updatingId, setUpdatingId] = useState(null)

    const fetchCart = async () => {
        setLoading(true)
        const guestId = await getGuestId()

        const { data, error } = await supabase
            .from('cart_items')
            .select(
                `id, quantity,
                variant:product_variants (
                    id, color, size_eu, size_us, stock,
                product:products ( id, name, price, image_url )
                )`
            )
            .eq('guest_id', guestId)
            .order('created_at', { ascending: false })

        if (error) {
            setError(error.message)
        } else {

            setItems((data || []).filter((item) => item.variant && item.variant.product))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCart()
    }, [])

    const updateQuantity = async (itemId, newQuantity, maxStock) => {
        if (newQuantity < 1 || newQuantity > maxStock) return
        setUpdatingId(itemId)

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', itemId)

        if (!error) {
            setItems((prev) =>
                prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
            )

        }
        setUpdatingId(null)
    }

    const removeItem = async (itemId) => {
        setUpdatingId(itemId)

        const { error } = await supabase.from('cart_items').delete().eq('id', itemId)

        if (!error) {
            setItems((prev) => prev.filter((item) => item.id !== itemId))

        }
        setUpdatingId(null)
    }

    const total = items.reduce((sum, item) => sum + item.variant.product.price * item.quantity, 0)

    if (error) {
        return <p className="text-red-600 text-center mt-10">حصل خطأ: {error}</p>
    }

    return (
        <div className="bg-center bg-cover bg-no-repeat min-h-screen" style={{ backgroundImage: `url(/background.png)` }}>
            <div className="container mx-auto py-20">


                {loading ? (
                    <div className="space-y-4 max-w-3xl">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <CartSkeleton key={i} />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center mt-20">
                        <p className="text-white/80 mb-4">الكارت فاضي حالياً</p>
                        <Link to="/products" className="text-red-500 underline">
                            تصفح المنتجات
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => {
                                const { product, color, size_eu, size_us, stock } = item.variant
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex gap-4 border border-white/20 bg-black/30 rounded-lg p-4 transition ${updatingId === item.id ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="h-24 w-24 object-cover rounded-md"
                                        />

                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h2 className="font-semibold text-lg text-white">{product.name}</h2>
                                                <p className="text-white/60 text-sm">
                                                    اللون: {color} {size_eu && `· مقاس EU ${size_eu}`} {size_us && `/ US ${size_us}`}
                                                </p>
                                                <p className="text-white/70">{product.price} جنيه</p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center border border-white/30 rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1, stock)}
                                                        disabled={updatingId === item.id}
                                                        className="px-3 py-1 text-white cursor-pointer"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="px-3 text-white">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1, stock)}
                                                        disabled={updatingId === item.id || item.quantity >= stock}
                                                        className="px-3 py-1 text-white cursor-pointer disabled:opacity-30"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={updatingId === item.id}
                                                    className="text-red-500 text-sm underline cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        </div>

                                        <p className="font-semibold self-start text-white">
                                            {(product.price * item.quantity).toLocaleString()} جنيه
                                        </p>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="border border-white/20 bg-black/30 rounded-lg p-6 h-fit space-y-4">
                            <h2 className="text-xl font-bold text-white">ملخص الطلب</h2>
                            <div className="flex justify-between text-white/70">
                                <span>عدد المنتجات</span>
                                <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-4 text-white">
                                <span>الإجمالي</span>
                                <span>{total.toLocaleString()} جنيه</span>
                            </div>
                            <Link
                                to="/checkout"
                                className="block text-center bg-red-700 text-white py-3 rounded-lg hover:bg-red-600 transition duration-300 mt-4"
                            >
                                إتمام الطلب
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Cart
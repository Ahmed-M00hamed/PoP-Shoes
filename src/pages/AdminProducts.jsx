import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const emptyForm = {
    id: null,
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
}

const emptyVariant = { color: '', size_eu: '', size_us: '', stock: '' }

function AdminProducts() {
    const navigate = useNavigate()

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    const [form, setForm] = useState(emptyForm)
    const [imageFile, setImageFile] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const [variants, setVariants] = useState([])
    const [newVariant, setNewVariant] = useState(emptyVariant)

    const [galleryImages, setGalleryImages] = useState([])
    const [newGalleryFile, setNewGalleryFile] = useState(null)
    const [newGalleryColor, setNewGalleryColor] = useState('')

    const [lowStockVariants, setLowStockVariants] = useState([])
    const [bestSellers, setBestSellers] = useState([])
    const [dashboardLoading, setDashboardLoading] = useState(true)

    const fetchLowStock = async () => {
        const { data } = await supabase
            .from('product_variants')
            .select('id, color, size_eu, size_us, stock, product:products(id, name, description, price, category, image_url)')
            .lte('stock', 3)
            .order('stock', { ascending: true })

        setLowStockVariants((data || []).filter((v) => v.product))
    }

    const fetchBestSellers = async () => {
        const { data } = await supabase.from('orders').select('items')

        const salesMap = {}
            ; (data || []).forEach((order) => {
                ; (order.items || []).forEach((item) => {
                    const key = item.product_id
                    if (!salesMap[key]) {
                        salesMap[key] = { name: item.name, totalQuantity: 0 }
                    }
                    salesMap[key].totalQuantity += item.quantity
                })
            })

        const sorted = Object.values(salesMap)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 5)

        setBestSellers(sorted)
    }

    useEffect(() => {
        const loadDashboard = async () => {
            setDashboardLoading(true)
            await Promise.all([fetchLowStock(), fetchBestSellers()])
            setDashboardLoading(false)
        }
        loadDashboard()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error) setProducts(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchVariants = async (productId) => {
        const { data } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: true })
        setVariants(data || [])
    }

    const fetchGalleryImages = async (productId) => {
        const { data } = await supabase
            .from('product_images')
            .select('*')
            .eq('product_id', productId)
            .order('sort_order', { ascending: true })
        setGalleryImages(data || [])
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const resetForm = () => {
        setForm(emptyForm)
        setImageFile(null)
        setError(null)
        setVariants([])
        setGalleryImages([])
        setNewVariant(emptyVariant)
        setNewGalleryFile(null)
        setNewGalleryColor('')
    }

    const handleEdit = (product) => {
        setForm({
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            category: product.category || '',
            image_url: product.image_url || '',
        })
        setImageFile(null)
        fetchVariants(product.id)
        fetchGalleryImages(product.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id) => {
        if (!confirm('متأكد إنك عايز تحذف المنتج ده؟ هيتحذف معاه كل الألوان والمقاسات والصور المرتبطة بيه.')) return

        const { error } = await supabase.from('products').delete().eq('id', id)
        if (!error) {
            setProducts((prev) => prev.filter((p) => p.id !== id))
            if (form.id === id) resetForm()
        }
    }

    const uploadFile = async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
        return data.publicUrl
    }

    // حفظ بيانات المنتج الأساسية
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            let imageUrl = form.image_url

            if (imageFile) {
                imageUrl = await uploadFile(imageFile)
            }

            const payload = {
                name: form.name,
                description: form.description,
                price: Number(form.price),
                category: form.category,
                image_url: imageUrl,
            }

            if (form.id) {
                const { error } = await supabase.from('products').update(payload).eq('id', form.id)
                if (error) throw error
                // بعد نجاح التعديل، نرجّع الفورم فاضي لوضع "إضافة منتج جديد"
                resetForm()
            } else {
                const { data, error } = await supabase.from('products').insert(payload).select().single()
                if (error) throw error
                // بعد إنشاء المنتج لأول مرة، نفتح له الفورم في وضع تعديل عشان يقدر يضيف ألوان وصور فوراً
                handleEdit(data)
            }

            setImageFile(null)
            fetchProducts()
        } catch (err) {
            setError(err.message || 'حصل خطأ أثناء الحفظ')
        } finally {
            setSaving(false)
        }
    }

    // إضافة variant (لون + مقاس + كمية)
    const handleAddVariant = async () => {
        if (!newVariant.color || (!newVariant.size_eu && !newVariant.size_us)) {
            alert('لازم تحدد اللون ومقاس واحد على الأقل')
            return
        }

        const { data, error } = await supabase
            .from('product_variants')
            .insert({
                product_id: form.id,
                color: newVariant.color,
                size_eu: newVariant.size_eu || null,
                size_us: newVariant.size_us || null,
                stock: Number(newVariant.stock) || 0,
            })
            .select()
            .single()

        if (!error) {
            setVariants((prev) => [...prev, data])
            setNewVariant(emptyVariant)
        }
    }

    const handleDeleteVariant = async (id) => {
        const { error } = await supabase.from('product_variants').delete().eq('id', id)
        if (!error) {
            setVariants((prev) => prev.filter((v) => v.id !== id))
        }
    }

    const handleUpdateVariantStock = async (id, newStock) => {
        const { error } = await supabase
            .from('product_variants')
            .update({ stock: Number(newStock) })
            .eq('id', id)

        if (!error) {
            setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, stock: Number(newStock) } : v)))
        }
    }

    // إضافة صورة للمعرض
    const handleAddGalleryImage = async () => {
        if (!newGalleryFile) {
            alert('اختار صورة الأول')
            return
        }

        try {
            const imageUrl = await uploadFile(newGalleryFile)

            const { data, error } = await supabase
                .from('product_images')
                .insert({
                    product_id: form.id,
                    image_url: imageUrl,
                    color: newGalleryColor || null,
                    sort_order: galleryImages.length,
                })
                .select()
                .single()

            if (error) throw error

            setGalleryImages((prev) => [...prev, data])
            setNewGalleryFile(null)
            setNewGalleryColor('')
        } catch (err) {
            alert('حصل خطأ أثناء رفع الصورة')
        }
    }

    const handleDeleteGalleryImage = async (id) => {
        const { error } = await supabase.from('product_images').delete().eq('id', id)
        if (!error) {
            setGalleryImages((prev) => prev.filter((img) => img.id !== id))
        }
    }

    return (
        <div dir="rtl" className="min-h-screen bg-gray-900 px-6 py-20">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">لوحة تحكم المنتجات</h1>
                    <button onClick={handleLogout} className="text-red-500 underline cursor-pointer">
                        تسجيل خروج
                    </button>
                </div>

                {/* تابات التنقل */}
                <div className="flex gap-3 mb-8">
                    <button className="px-4 py-2 rounded-lg bg-red-700 text-white cursor-pointer">
                        المنتجات
                    </button>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="px-4 py-2 rounded-lg bg-gray-700 text-white cursor-pointer"
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

                {/* لوحة معلومات: مخزون قارب على النفاد + أكتر المنتجات مبيعاً */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-lg p-5">
                        <h2 className="text-white font-bold mb-4">⚠️ مخزون قارب على النفاد</h2>
                        {dashboardLoading ? (
                            <p className="text-white/60 text-sm">جاري التحميل...</p>
                        ) : lowStockVariants.length === 0 ? (
                            <p className="text-white/60 text-sm">مفيش مقاسات قربت تخلص حالياً</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {lowStockVariants.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center gap-3 bg-gray-700 rounded-lg p-2 cursor-pointer hover:bg-gray-600"
                                        onClick={() => handleEdit(v.product)}
                                    >
                                        <img
                                            src={v.product.image_url}
                                            alt=""
                                            className="h-10 w-10 object-cover rounded"
                                        />
                                        <div className="flex-1 text-sm text-white">
                                            <p className="font-medium">{v.product.name}</p>
                                            <p className="text-white/60">
                                                {v.color} {v.size_eu && `· EU ${v.size_eu}`}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full font-bold ${v.stock === 0 ? 'bg-red-600' : 'bg-orange-500'
                                                } text-white`}
                                        >
                                            {v.stock === 0 ? 'خلص' : `باقي ${v.stock}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800 rounded-lg p-5">
                        <h2 className="text-white font-bold mb-4">🔥 الأكثر مبيعاً</h2>
                        {dashboardLoading ? (
                            <p className="text-white/60 text-sm">جاري التحميل...</p>
                        ) : bestSellers.length === 0 ? (
                            <p className="text-white/60 text-sm">لسه مفيش مبيعات كفاية لعرضها</p>
                        ) : (
                            <div className="space-y-2">
                                {bestSellers.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between bg-gray-700 rounded-lg p-3 text-sm text-white"
                                    >
                                        <span>
                                            {idx + 1}. {item.name}
                                        </span>
                                        <span className="font-bold">{item.totalQuantity} قطعة</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* فورم بيانات المنتج الأساسية */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-gray-800 rounded-lg p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <h2 className="md:col-span-2 text-lg font-bold text-white">
                        {form.id ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
                    </h2>

                    <input
                        type="text"
                        name="name"
                        placeholder="اسم المنتج"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="px-4 py-3 rounded-lg bg-gray-700 text-white"
                    />

                    <input
                        type="text"
                        name="category"
                        placeholder="التصنيف (مثلاً Sneakers)"
                        value={form.category}
                        onChange={handleChange}
                        className="px-4 py-3 rounded-lg bg-gray-700 text-white"
                    />

                    <input
                        type="number"
                        name="price"
                        placeholder="السعر"
                        value={form.price}
                        onChange={handleChange}
                        required
                        className="px-4 py-3 rounded-lg bg-gray-700 text-white"
                    />

                    <textarea
                        name="description"
                        placeholder="الوصف"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        className="md:col-span-2 px-4 py-3 rounded-lg bg-gray-700 text-white"
                    />

                    <div className="md:col-span-2">
                        <label className="block text-white mb-2">الصورة الرئيسية (تظهر في صفحة المنتجات)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="text-white"
                        />
                        {form.image_url && !imageFile && (
                            <img src={form.image_url} alt="preview" className="h-20 mt-2 rounded" />
                        )}
                    </div>

                    {error && <p className="md:col-span-2 text-red-500">{error}</p>}

                    <div className="md:col-span-2 flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'جاري الحفظ...' : form.id ? 'حفظ التعديل' : 'إنشاء المنتج'}
                        </button>

                        {form.id && (
                            <button type="button" onClick={resetForm} className="text-white underline cursor-pointer">
                                منتج جديد بدل التعديل
                            </button>
                        )}
                    </div>
                </form>

                {/* قسم الألوان والمقاسات - يظهر بس بعد حفظ المنتج */}
                {form.id && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-bold text-white mb-4">الألوان والمقاسات المتاحة</h2>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                            <input
                                type="text"
                                placeholder="اللون (مثلاً أحمر)"
                                value={newVariant.color}
                                onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                                className="px-3 py-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="text"
                                placeholder="مقاس أوروبي"
                                value={newVariant.size_eu}
                                onChange={(e) => setNewVariant({ ...newVariant, size_eu: e.target.value })}
                                className="px-3 py-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="text"
                                placeholder="مقاس أمريكي"
                                value={newVariant.size_us}
                                onChange={(e) => setNewVariant({ ...newVariant, size_us: e.target.value })}
                                className="px-3 py-2 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                placeholder="الكمية"
                                value={newVariant.stock}
                                onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                                className="px-3 py-2 rounded-lg bg-gray-700 text-white"
                            />
                            <button
                                type="button"
                                onClick={handleAddVariant}
                                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer"
                            >
                                إضافة
                            </button>
                        </div>

                        {variants.length === 0 ? (
                            <p className="text-white/60">لسه مفيش ألوان أو مقاسات مضافة</p>
                        ) : (
                            <table className="w-full text-white">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="text-right p-2">اللون</th>
                                        <th className="text-right p-2">مقاس EU</th>
                                        <th className="text-right p-2">مقاس US</th>
                                        <th className="text-right p-2">الكمية</th>
                                        <th className="text-right p-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.map((v) => (
                                        <tr key={v.id} className="border-t border-gray-700">
                                            <td className="p-2">{v.color}</td>
                                            <td className="p-2">{v.size_eu || '-'}</td>
                                            <td className="p-2">{v.size_us || '-'}</td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    defaultValue={v.stock}
                                                    onBlur={(e) => handleUpdateVariantStock(v.id, e.target.value)}
                                                    className="w-20 px-2 py-1 rounded bg-gray-700 text-white"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <button
                                                    onClick={() => handleDeleteVariant(v.id)}
                                                    className="text-red-500 underline cursor-pointer"
                                                >
                                                    حذف
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* قسم معرض الصور - يظهر بس بعد حفظ المنتج */}
                {form.id && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-10">
                        <h2 className="text-lg font-bold text-white mb-4">معرض الصور الإضافي</h2>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewGalleryFile(e.target.files[0])}
                                className="text-white"
                            />
                            <input
                                type="text"
                                placeholder="اللون (اختياري)"
                                value={newGalleryColor}
                                onChange={(e) => setNewGalleryColor(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-gray-700 text-white"
                            />
                            <button
                                type="button"
                                onClick={handleAddGalleryImage}
                                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer"
                            >
                                رفع الصورة
                            </button>
                        </div>

                        {galleryImages.length === 0 ? (
                            <p className="text-white/60">لسه مفيش صور إضافية</p>
                        ) : (
                            <div className="flex flex-wrap gap-4">
                                {galleryImages.map((img) => (
                                    <div key={img.id} className="relative">
                                        <img src={img.image_url} alt="" className="h-24 w-24 object-cover rounded" />
                                        {img.color && (
                                            <span className="absolute bottom-0 left-0 bg-black/70 text-white text-xs px-1 rounded">
                                                {img.color}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleDeleteGalleryImage(img.id)}
                                            className="absolute -top-2 -right-2 bg-red-700 text-white w-6 h-6 rounded-full text-xs cursor-pointer"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* جدول كل المنتجات */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    {loading ? (
                        <p className="text-white p-6">جاري التحميل...</p>
                    ) : products.length === 0 ? (
                        <p className="text-white/70 p-6">لا توجد منتجات حالياً</p>
                    ) : (
                        <table className="w-full text-white">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="text-right p-4">الصورة</th>
                                    <th className="text-right p-4">الاسم</th>
                                    <th className="text-right p-4">السعر</th>
                                    <th className="text-right p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-t border-gray-700">
                                        <td className="p-4">
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="h-12 w-12 object-cover rounded"
                                            />
                                        </td>
                                        <td className="p-4">{product.name}</td>
                                        <td className="p-4">{product.price} جنيه</td>
                                        <td className="p-4 flex gap-3">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="text-blue-400 underline cursor-pointer"
                                            >
                                                تعديل / الألوان والصور
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="text-red-500 underline cursor-pointer"
                                            >
                                                حذف
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminProducts
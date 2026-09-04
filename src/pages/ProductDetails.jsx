import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { addToCart } from '../utils/cart'


function ProductDetails() {
    const { id } = useParams()


    const [product, setProduct] = useState(null)
    const [variants, setVariants] = useState([])
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedColor, setSelectedColor] = useState(null)
    const [selectedSizeKey, setSelectedSizeKey] = useState(null)
    const [activeImage, setActiveImage] = useState(null)
    const [quantity, setQuantity] = useState(1)

    const [adding, setAdding] = useState(false)
    const [added, setAdded] = useState(false)

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)

            const [{ data: productData, error: productError }, { data: variantsData }, { data: imagesData }] =
                await Promise.all([
                    supabase.from('products').select('*').eq('id', id).single(),
                    supabase.from('product_variants').select('*').eq('product_id', id),
                    supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
                ])

            if (productError) {
                setError(productError.message)
                setLoading(false)
                return
            }

            setProduct(productData)
            setVariants(variantsData || [])
            setImages(imagesData || [])
            setActiveImage(productData.image_url)

            if (variantsData && variantsData.length > 0) {
                setSelectedColor(variantsData[0].color)
            }

            setLoading(false)
        }

        fetchAll()
    }, [id])

    const availableColors = useMemo(() => {
        return [...new Set(variants.map((v) => v.color))]
    }, [variants])

    const sizesForSelectedColor = useMemo(() => {
        return variants.filter((v) => v.color === selectedColor)
    }, [variants, selectedColor])

    const selectedVariant = useMemo(() => {
        return sizesForSelectedColor.find((v) => v.id === selectedSizeKey) || null
    }, [sizesForSelectedColor, selectedSizeKey])

    const galleryForSelectedColor = useMemo(() => {
        const colorSpecific = images.filter((img) => img.color === selectedColor)
        const general = images.filter((img) => !img.color)
        return [...colorSpecific, ...general]
    }, [images, selectedColor])

    useEffect(() => {
        setSelectedSizeKey(null)
        setActiveImage(product?.image_url)
        setAdded(false)
    }, [selectedColor, product])

    const handleQuantityChange = (newQuantity) => {
        setQuantity(newQuantity)
        if (added) setAdded(false)
    }

    const handleAddToCart = async () => {
        if (!selectedVariant) {
            alert('من فضلك اختار المقاس الأول')
            return
        }

        setAdding(true)
        try {
            await addToCart(product.id, selectedVariant.id, quantity)
            setAdded(true)
        } catch (err) {
            console.error('Add to cart error:', err)
            alert('حصل خطأ أثناء الإضافة للكارت: ' + (err.message || 'غير معروف'))
        } finally {
            setAdding(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-center bg-cover bg-no-repeat min-h-screen" style={{ backgroundImage: `url(/background.png)` }}>
                <div className="container mx-auto py-16 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-gray-300/30 h-96 rounded-lg"></div>
                        <div className="space-y-4">
                            <div className="bg-gray-300/30 h-8 w-2/3 rounded"></div>
                            <div className="bg-gray-300/30 h-4 w-1/3 rounded"></div>
                            <div className="bg-gray-300/30 h-24 w-full rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="text-center mt-20">
                <p className="text-red-600 mb-4">المنتج غير موجود أو حدث خطأ</p>
                <Link to="/products" className="text-red-700 underline">
                    ارجع لصفحة المنتجات
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-center bg-cover bg-no-repeat min-h-screen" style={{ backgroundImage: `url(/background.png)` }}>
            <div className="container mx-auto py-20 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <img
                            src={activeImage}
                            alt={product.name}
                            className="w-full h-96 object-cover rounded-lg mb-4"
                        />

                        {galleryForSelectedColor.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto">
                                <button onClick={() => setActiveImage(product.image_url)}>
                                    <img
                                        src={product.image_url}
                                        alt="main"
                                        className={`h-16 w-16 object-cover rounded cursor-pointer border-2 ${activeImage === product.image_url ? 'border-red-600' : 'border-transparent'
                                            }`}
                                    />
                                </button>
                                {galleryForSelectedColor.map((img) => (
                                    <button key={img.id} onClick={() => setActiveImage(img.image_url)}>
                                        <img
                                            src={img.image_url}
                                            alt=""
                                            className={`h-16 w-16 object-cover rounded cursor-pointer border-2 ${activeImage === img.image_url ? 'border-red-600' : 'border-transparent'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-5">
                        <h1 className="text-3xl font-bold text-white">{product.name}</h1>
                        <p className="text-2xl text-red-700 font-semibold">{product.price} جنيه</p>
                        <p className="text-white leading-relaxed">{product.description}</p>

                        {availableColors.length > 0 && (
                            <div>
                                <p className="text-white mb-2">اللون</p>
                                <div className="flex gap-3 flex-wrap">
                                    {availableColors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`px-4 py-2 rounded-lg border cursor-pointer ${selectedColor === color
                                                    ? 'bg-red-700 border-red-700 text-white'
                                                    : 'border-white/40 text-white'
                                                }`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sizesForSelectedColor.length > 0 && (
                            <div>
                                <p className="text-white mb-2">المقاس</p>
                                <div className="flex gap-3 flex-wrap">
                                    {sizesForSelectedColor.map((v) => (
                                        <div key={v.id} className="flex flex-col items-center">
                                            <button
                                                onClick={() => setSelectedSizeKey(v.id)}
                                                disabled={v.stock === 0}
                                                className={`px-4 py-2 rounded-lg border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${selectedSizeKey === v.id
                                                        ? 'bg-red-700 border-red-700 text-white'
                                                        : 'border-white/40 text-white'
                                                    }`}
                                            >
                                                {v.size_eu ? `EU ${v.size_eu}` : ''} {v.size_us ? `/ US ${v.size_us}` : ''}
                                            </button>
                                            {v.stock > 0 && v.stock <= 3 && (
                                                <span className="text-orange-400 text-xs mt-1">باقي {v.stock}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-sm">
                            {selectedVariant ? (
                                selectedVariant.stock === 0 ? (
                                    <span className="text-red-500">غير متوفر بهذا المقاس</span>
                                ) : selectedVariant.stock <= 3 ? (
                                    <span className="text-orange-400 font-semibold">
                                        باقي {selectedVariant.stock} بس! سارع بالطلب
                                    </span>
                                ) : (
                                    <span className="text-white/70">متوفر ({selectedVariant.stock} قطعة)</span>
                                )
                            ) : availableColors.length > 0 ? (
                                <span className="text-white/70">اختار اللون والمقاس</span>
                            ) : null}
                        </p>

                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center border border-white rounded-lg">
                                <button
                                    onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                                    className="px-4 py-2 text-lg text-white cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="px-4 text-white">{quantity}</span>
                                <button
                                    onClick={() =>
                                        handleQuantityChange(Math.min(selectedVariant?.stock || 1, quantity + 1))
                                    }
                                    className="px-4 py-2 text-lg text-white cursor-pointer"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={adding || added || !selectedVariant || selectedVariant.stock === 0}
                                className="flex-1 bg-red-700 text-white py-3 rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {adding ? 'جاري الإضافة...' : added ? '✓ تمت الإضافة' : 'أضف للكارت'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails
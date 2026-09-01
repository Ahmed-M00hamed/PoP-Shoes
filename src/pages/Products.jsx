import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

function ProductSkeleton() {
    return (
        <div className="border rounded-lg p-4 animate-pulse">
            <div className="bg-gray-300 h-40 rounded-md mb-4"></div>
            <div className="bg-gray-300 h-4 w-3/4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 w-1/2 rounded"></div>
        </div>
    )
}

function Products() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                setError(error.message)
            } else {
                setProducts(data)
            }
            setLoading(false)
        }

        fetchProducts()
    }, [])

    // كل التصنيفات المتاحة (بدون تكرار)
    const categories = useMemo(() => {
        return [...new Set(products.map((p) => p.category).filter(Boolean))]
    }, [products])

    // المنتجات بعد الفلترة بالبحث والتصنيف
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [products, searchTerm, selectedCategory])

    if (error) {
        return <p className="text-red-600 text-center mt-10">حصل خطأ: {error}</p>
    }

    return (
        <div className="bg-center bg-cover bg-no-repeat min-h-screen" style={{ backgroundImage: `url(/background.png)` }}>
            <div className="container mx-auto py-20">
                <h1 className="text-3xl font-bold mb-6 text-white">All Products</h1>

                {/* البحث والفلترة */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <input
                        type="text"
                        placeholder="ابحث عن منتج..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-lg bg-black/30 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
                    />

                    {categories.length > 0 && (
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 rounded-lg bg-black/30 border border-white/30 text-white focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                            <option value="all" className="text-black">كل التصنيفات</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat} className="text-black">
                                    {cat}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
                        : filteredProducts.map((product) => (
                            <Link
                                to={`/product/${product.id}`}
                                key={product.id}
                                className="border rounded-lg p-4 hover:shadow-lg transition duration-300"
                            >
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="h-40 w-full object-cover rounded-md mb-4"
                                />
                                <h2 className="font-semibold text-lg text-white">{product.name}</h2>
                                <p className="text-white">{product.price} جنيه</p>
                            </Link>
                        ))}
                </div>

                {!loading && filteredProducts.length === 0 && (
                    <p className="text-center text-gray-300 mt-10">لا توجد منتجات مطابقة</p>
                )}
            </div>
        </div>
    )
}

export default Products
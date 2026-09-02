import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function AdminSales() {
    const navigate = useNavigate()

    const [orders, setOrders] = useState([])
    const [sales, setSales] = useState([])

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [expandedProduct, setExpandedProduct] = useState(null)

    const [dateFilter, setDateFilter] = useState('all')

    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')

    // البحث
    const [searchTerm, setSearchTerm] = useState('')

    const [totalSales, setTotalSales] = useState(0)
    const [totalSoldItems, setTotalSoldItems] = useState(0)
    const [deliveredOrdersCount, setDeliveredOrdersCount] = useState(0)

    // =========================
    // تحديد الفترة الزمنية
    // =========================

    const getDateRange = () => {
        const now = new Date()

        let startDate = null
        let endDate = null

        if (dateFilter === 'today') {
            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1
            )
        }

        if (dateFilter === '7days') {
            startDate = new Date(now)

            startDate.setDate(now.getDate() - 6)
            startDate.setHours(0, 0, 0, 0)

            endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1
            )
        }

        if (dateFilter === 'thisMonth') {
            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1
            )
        }

        if (dateFilter === 'lastMonth') {
            startDate = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )
        }

        if (dateFilter === 'custom') {
            if (!customStartDate || !customEndDate) {
                return {
                    startDate: null,
                    endDate: null,
                }
            }

            startDate = new Date(
                `${customStartDate}T00:00:00`
            )

            endDate = new Date(
                `${customEndDate}T23:59:59`
            )
        }

        return {
            startDate,
            endDate,
        }
    }

    // =========================
    // تحميل المبيعات
    // =========================

    const fetchSales = async () => {
        setRefreshing(true)

        const { startDate, endDate } = getDateRange()

        let query = supabase
            .from('orders')
            .select('id, items, total, created_at, status')
            .eq('status', 'delivered')
            .order('created_at', { ascending: false })

        if (startDate) {
            query = query.gte(
                'created_at',
                startDate.toISOString()
            )
        }

        if (endDate) {
            query = query.lte(
                'created_at',
                endDate.toISOString()
            )
        }

        const { data, error } = await query

        if (error) {
            console.error(
                'Error fetching sales:',
                error
            )

            setOrders([])
            setSales([])

            setTotalSales(0)
            setTotalSoldItems(0)
            setDeliveredOrdersCount(0)

            setLoading(false)
            setRefreshing(false)

            return
        }

        setOrders(data || [])

        const salesMap = {}

        let salesTotal = 0
        let soldItemsTotal = 0

        ;(data || []).forEach((order) => {
            ;(order.items || []).forEach((item) => {
                const quantity =
                    Number(item.quantity) || 0

                const price =
                    Number(item.price) || 0

                const itemTotal =
                    price * quantity

                // نفس المنتج يظهر مرة واحدة
                const productKey =
                    item.product_id || item.name

                if (!salesMap[productKey]) {
                    salesMap[productKey] = {
                        id: productKey,

                        name:
                            item.name ||
                            'منتج بدون اسم',

                        price: price,

                        quantity: 0,

                        total: 0,

                        variants: {},
                    }
                }

                // إجمالي المنتج
                salesMap[productKey].quantity +=
                    quantity

                salesMap[productKey].total +=
                    itemTotal

                // =========================
                // تفاصيل اللون والمقاس
                // =========================

                const variantKey = [
                    item.color || '-',
                    item.size_eu || '-',
                    item.size_us || '-',
                ].join('|')

                if (
                    !salesMap[productKey]
                        .variants[variantKey]
                ) {
                    salesMap[productKey].variants[
                        variantKey
                    ] = {
                        color:
                            item.color || '-',

                        size_eu:
                            item.size_eu || '-',

                        size_us:
                            item.size_us || '-',

                        price: price,

                        quantity: 0,

                        total: 0,
                    }
                }

                salesMap[productKey].variants[
                    variantKey
                ].quantity += quantity

                salesMap[productKey].variants[
                    variantKey
                ].total += itemTotal

                salesTotal += itemTotal

                soldItemsTotal += quantity
            })
        })

        const salesList = Object.values(
            salesMap
        )
            .map((product) => ({
                ...product,

                variants: Object.values(
                    product.variants
                ).sort(
                    (a, b) =>
                        b.quantity - a.quantity
                ),
            }))
            .sort(
                (a, b) =>
                    b.quantity - a.quantity
            )

        setSales(salesList)

        setTotalSales(salesTotal)

        setTotalSoldItems(
            soldItemsTotal
        )

        setDeliveredOrdersCount(
            (data || []).length
        )

        setLoading(false)
        setRefreshing(false)
    }

    useEffect(() => {
        fetchSales()
    }, [
        dateFilter,
        customStartDate,
        customEndDate,
    ])

    // =========================
    // تسجيل الخروج
    // =========================

    const handleLogout = async () => {
        await supabase.auth.signOut()

        navigate('/admin/login')
    }

    // =========================
    // فتح / غلق التفاصيل
    // =========================

    const toggleProduct = (productId) => {
        setExpandedProduct((prev) =>
            prev === productId
                ? null
                : productId
        )
    }

    // =========================
    // متوسط الطلب
    // =========================

    const averageOrderValue =
        deliveredOrdersCount > 0
            ? totalSales /
              deliveredOrdersCount
            : 0

    // =========================
    // الأكثر مبيعاً
    // =========================

    const bestSeller = useMemo(() => {
        if (sales.length === 0) {
            return null
        }

        return [...sales].sort(
            (a, b) =>
                b.quantity - a.quantity
        )[0]
    }, [sales])

    // =========================
    // البحث في المنتجات
    // =========================

    const filteredSales = useMemo(() => {
        const search = searchTerm
            .trim()
            .toLowerCase()

        if (!search) {
            return sales
        }

        return sales.filter((product) =>
            product.name
                .toLowerCase()
                .includes(search)
        )
    }, [sales, searchTerm])

    // =========================
    // الرسم البياني
    // =========================

    const chartData = useMemo(() => {
        const dailySales = {}

        orders.forEach((order) => {
            const date = new Date(
                order.created_at
            )

            const key =
                date
                    .toISOString()
                    .split('T')[0]

            if (!dailySales[key]) {
                dailySales[key] = 0
            }

            dailySales[key] +=
                Number(order.total) || 0
        })

        return Object.entries(
            dailySales
        )
            .sort(
                ([a], [b]) =>
                    new Date(a) -
                    new Date(b)
            )
            .slice(-7)
            .map(
                ([date, total]) => ({
                    date,
                    total,
                })
            )
    }, [orders])

    const maxChartValue =
        Math.max(
            ...chartData.map(
                (item) => item.total
            ),
            1
        )

    const filterLabel = {
        all: 'كل المبيعات',
        today: 'مبيعات اليوم',
        days7: 'آخر 7 أيام',
        thisMonth: 'هذا الشهر',
        lastMonth: 'الشهر الماضي',
        custom: 'فترة مخصصة',
    }

    return (
        <div
            dir="rtl"
            className="min-h-screen bg-gray-900 px-3 sm:px-6 py-16 sm:py-20"
        >

            <div className="max-w-7xl mx-auto">

                {/* =========================
                    Header
                ========================= */}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">

                    <div>

                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                            لوحة تحكم المبيعات
                        </h1>

                        <p className="text-white/50 text-xs sm:text-sm mt-1">
                            {filterLabel[dateFilter]}
                        </p>

                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-red-500 underline cursor-pointer text-sm"
                    >
                        تسجيل خروج
                    </button>

                </div>

                {/* =========================
                    Navigation
                ========================= */}

                <div className="grid grid-cols-3 gap-2 mb-6 sm:flex sm:gap-3">

                    <button
                        onClick={() =>
                            navigate('/admin')
                        }
                        className="px-3 sm:px-4 py-2 rounded-lg bg-gray-700 text-white text-sm cursor-pointer hover:bg-gray-600 transition"
                    >
                        المنتجات
                    </button>

                    <button
                        onClick={() =>
                            navigate(
                                '/admin/orders'
                            )
                        }
                        className="px-3 sm:px-4 py-2 rounded-lg bg-gray-700 text-white text-sm cursor-pointer hover:bg-gray-600 transition"
                    >
                        الطلبات
                    </button>

                    <button
                        className="px-3 sm:px-4 py-2 rounded-lg bg-red-700 text-white text-sm cursor-pointer"
                    >
                        المبيعات
                    </button>

                </div>

                {/* =========================
                    Date Filters
                ========================= */}

                <div className="bg-gray-800 rounded-lg p-4 mb-6">

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">

                        <button
                            onClick={() =>
                                setDateFilter('all')
                            }
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer ${
                                dateFilter === 'all'
                                    ? 'bg-red-700 text-white'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                            الكل
                        </button>

                        <button
                            onClick={() =>
                                setDateFilter('today')
                            }
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer ${
                                dateFilter === 'today'
                                    ? 'bg-red-700 text-white'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                            اليوم
                        </button>

                        <button
                            onClick={() =>
                                setDateFilter('7days')
                            }
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer ${
                                dateFilter === 'days7'
                                    ? 'bg-red-700 text-white'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                            آخر 7 أيام
                        </button>

                        <button
                            onClick={() =>
                                setDateFilter(
                                    'thisMonth'
                                )
                            }
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer ${
                                dateFilter === 'thisMonth'
                                    ? 'bg-red-700 text-white'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                            هذا الشهر
                        </button>

                        <button
                            onClick={() =>
                                setDateFilter(
                                    'lastMonth'
                                )
                            }
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer ${
                                dateFilter === 'lastMonth'
                                    ? 'bg-red-700 text-white'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                            الشهر الماضي
                        </button>

                        <button
                            onClick={() =>
                                setDateFilter(
                                    'custom'
                                )
                            }
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer ${
                                dateFilter === 'custom'
                                    ? 'bg-red-700 text-white'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                            فترة مخصصة
                        </button>

                    </div>

                    {/* Custom Dates */}

                    {dateFilter === 'custom' && (

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">

                            <div>

                                <label className="block text-white/60 text-xs mb-2">
                                    من تاريخ
                                </label>

                                <input
                                    type="date"
                                    value={
                                        customStartDate
                                    }
                                    onChange={(e) =>
                                        setCustomStartDate(
                                            e.target.value
                                        )
                                    }
                                    className="w-full bg-gray-700 text-white px-3 py-3 rounded-lg text-sm"
                                />

                            </div>

                            <div>

                                <label className="block text-white/60 text-xs mb-2">
                                    إلى تاريخ
                                </label>

                                <input
                                    type="date"
                                    value={
                                        customEndDate
                                    }
                                    onChange={(e) =>
                                        setCustomEndDate(
                                            e.target.value
                                        )
                                    }
                                    className="w-full bg-gray-700 text-white px-3 py-3 rounded-lg text-sm"
                                />

                            </div>

                        </div>
                    )}

                </div>

                {/* =========================
                    Statistics
                ========================= */}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">

                    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">

                        <p className="text-white/60 text-xs sm:text-sm mb-2">
                            إجمالي المبيعات
                        </p>

                        <p className="text-lg sm:text-2xl font-bold text-green-400">

                            {loading
                                ? '...'
                                : totalSales.toLocaleString(
                                      'ar-EG'
                                  )}

                            {' '}جنيه

                        </p>

                        <p className="text-white/40 text-[10px] sm:text-xs mt-2">
                            الطلبات المسلّمة فقط
                        </p>

                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">

                        <p className="text-white/60 text-xs sm:text-sm mb-2">
                            القطع المباعة
                        </p>

                        <p className="text-lg sm:text-2xl font-bold text-blue-400">

                            {loading
                                ? '...'
                                : totalSoldItems.toLocaleString(
                                      'ar-EG'
                                  )}

                            {' '}قطعة

                        </p>

                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">

                        <p className="text-white/60 text-xs sm:text-sm mb-2">
                            الطلبات المسلّمة
                        </p>

                        <p className="text-lg sm:text-2xl font-bold text-purple-400">

                            {loading
                                ? '...'
                                : deliveredOrdersCount.toLocaleString(
                                      'ar-EG'
                                  )}

                        </p>

                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">

                        <p className="text-white/60 text-xs sm:text-sm mb-2">
                            متوسط الطلب
                        </p>

                        <p className="text-lg sm:text-2xl font-bold text-yellow-400">

                            {loading
                                ? '...'
                                : Math.round(
                                      averageOrderValue
                                  ).toLocaleString(
                                      'ar-EG'
                                  )}

                            {' '}جنيه

                        </p>

                    </div>

                </div>

                {/* =========================
                    Best Seller
                ========================= */}

                {!loading && bestSeller && (

                    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">

                        <div className="flex justify-between items-center gap-3">

                            <div className="min-w-0">

                                <p className="text-white/50 text-xs sm:text-sm mb-1">
                                    🏆 الأكثر مبيعاً
                                </p>

                                <h2 className="text-base sm:text-xl font-bold text-white truncate">
                                    {bestSeller.name}
                                </h2>

                            </div>

                            <div className="text-left shrink-0">

                                <p className="text-blue-400 font-bold text-sm sm:text-lg">
                                    {bestSeller.quantity.toLocaleString(
                                        'ar-EG'
                                    )}{' '}
                                    قطعة
                                </p>

                                <p className="text-green-400 text-xs sm:text-sm">
                                    {bestSeller.total.toLocaleString(
                                        'ar-EG'
                                    )}{' '}
                                    جنيه
                                </p>

                            </div>

                        </div>

                    </div>
                )}

                {/* =========================
                    Chart
                ========================= */}

                {!loading &&
                    chartData.length > 0 && (

                        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">

                            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                                📈 المبيعات اليومية
                            </h2>

                            <p className="text-white/50 text-xs sm:text-sm mb-6">
                                آخر 7 أيام متاحة
                            </p>

                            <div className="flex items-end gap-2 sm:gap-3 h-52 sm:h-64">

                                {chartData.map(
                                    (item) => {

                                        const height =
                                            (item.total /
                                                maxChartValue) *
                                            100

                                        const date =
                                            new Date(
                                                `${item.date}T00:00:00`
                                            )

                                        return (
                                            <div
                                                key={
                                                    item.date
                                                }
                                                className="flex-1 h-full flex flex-col justify-end items-center gap-1"
                                            >

                                                <p className="text-white text-[9px] sm:text-xs font-bold truncate max-w-full">
                                                    {item.total.toLocaleString(
                                                        'ar-EG'
                                                    )}
                                                </p>

                                                <div className="w-full flex items-end h-36 sm:h-44">

                                                    <div
                                                        className="w-full bg-red-700 rounded-t-md sm:rounded-t-lg hover:bg-red-600 transition"
                                                        style={{
                                                            height: `${Math.max(
                                                                height,
                                                                4
                                                            )}%`,
                                                        }}
                                                    />

                                                </div>

                                                <p className="text-white/50 text-[9px] sm:text-xs">
                                                    {date.toLocaleDateString(
                                                        'ar-EG',
                                                        {
                                                            day: 'numeric',
                                                            month: 'numeric',
                                                        }
                                                    )}
                                                </p>

                                            </div>
                                        )
                                    }
                                )}

                            </div>

                        </div>
                    )}

                {/* =========================
                    Products Sales
                ========================= */}

                <div className="bg-gray-800 rounded-lg overflow-hidden">

                    {/* Header */}

                    <div className="p-4 sm:p-6 border-b border-gray-700">

                        <div className="flex flex-col sm:flex-row justify-between gap-4">

                            <div>

                                <h2 className="text-lg sm:text-xl font-bold text-white">
                                    المنتجات المباعة
                                </h2>

                                <p className="text-white/50 text-xs sm:text-sm mt-1">
                                    اضغط على المنتج لعرض الألوان والمقاسات
                                </p>

                            </div>

                            <button
                                onClick={
                                    fetchSales
                                }
                                disabled={
                                    refreshing
                                }
                                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition cursor-pointer disabled:opacity-50 text-sm"
                            >
                                {refreshing
                                    ? 'جاري التحديث...'
                                    : 'تحديث'}
                            </button>

                        </div>

                        {/* =========================
                            Search
                        ========================= */}

                        <div className="relative mt-5">

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none">
                                🔍
                            </span>

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
                                    )
                                }
                                placeholder="ابحث عن منتج في المبيعات..."
                                className="w-full bg-gray-900 border border-gray-700 text-white placeholder:text-white/30 rounded-lg px-11 py-3 text-sm focus:outline-none focus:border-red-600 transition"
                            />

                            {searchTerm && (
                                <button
                                    onClick={() =>
                                        setSearchTerm(
                                            ''
                                        )
                                    }
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer text-lg"
                                    title="مسح البحث"
                                >
                                    ×
                                </button>
                            )}

                        </div>

                        {/* Search Result Count */}

                        {!loading &&
                            searchTerm.trim() && (

                                <p className="text-white/40 text-xs mt-3">

                                    تم العثور على{' '}

                                    <span className="text-white font-bold">
                                        {
                                            filteredSales.length
                                        }
                                    </span>

                                    {' '}منتج

                                </p>
                            )}

                    </div>

                    {/* =========================
                        Loading
                    ========================= */}

                    {loading ? (

                        <p className="text-white/60 p-6">
                            جاري تحميل المبيعات...
                        </p>

                    ) : filteredSales.length === 0 ? (

                        <div className="p-8 sm:p-10 text-center">

                            <div className="text-4xl mb-3">
                                🔍
                            </div>

                            <p className="text-white/70 text-lg">
                                {searchTerm.trim()
                                    ? 'لا يوجد منتج مطابق للبحث'
                                    : 'لا توجد مبيعات في هذه الفترة'}
                            </p>

                            <p className="text-white/40 text-sm mt-2">

                                {searchTerm.trim()
                                    ? 'جرّب كتابة اسم المنتج بطريقة مختلفة.'
                                    : 'جرّب اختيار فترة زمنية مختلفة.'}

                            </p>

                            {searchTerm.trim() && (

                                <button
                                    onClick={() =>
                                        setSearchTerm(
                                            ''
                                        )
                                    }
                                    className="mt-4 bg-red-700 text-white px-5 py-2 rounded-lg cursor-pointer hover:bg-red-600 transition"
                                >
                                    مسح البحث
                                </button>

                            )}

                        </div>

                    ) : (

                        /* =========================
                            Products List
                        ========================= */

                        <div className="divide-y divide-gray-700">

                            {filteredSales.map(
                                (
                                    product,
                                    index
                                ) => (

                                    <div
                                        key={
                                            product.id
                                        }
                                        className="p-4 sm:p-5"
                                    >

                                        {/* =========================
                                            Product Main
                                        ========================= */}

                                        <button
                                            onClick={() =>
                                                toggleProduct(
                                                    product.id
                                                )
                                            }
                                            className="w-full text-right cursor-pointer"
                                        >

                                            <div className="flex items-center gap-3">

                                                {/* Number */}

                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center text-white/60 text-xs sm:text-sm shrink-0">
                                                    {index +
                                                        1}
                                                </div>

                                                {/* Name */}

                                                <div className="flex-1 min-w-0">

                                                    <p className="text-white font-bold text-sm sm:text-base truncate">
                                                        {
                                                            product.name
                                                        }
                                                    </p>

                                                    <p className="text-white/40 text-xs mt-1">

                                                        {expandedProduct ===
                                                        product.id
                                                            ? 'اضغط لإخفاء التفاصيل'
                                                            : 'اضغط لعرض الألوان والمقاسات'}

                                                    </p>

                                                </div>

                                                {/* Arrow */}

                                                <div className="text-white/50 text-lg shrink-0">

                                                    {expandedProduct ===
                                                    product.id
                                                        ? '▲'
                                                        : '▼'}

                                                </div>

                                            </div>

                                            {/* Summary */}

                                            <div className="grid grid-cols-3 gap-2 mt-4">

                                                <div className="bg-gray-900 rounded-lg p-2 sm:p-3 text-center">

                                                    <p className="text-white/40 text-[10px] sm:text-xs">
                                                        السعر
                                                    </p>

                                                    <p className="text-white font-bold text-xs sm:text-sm mt-1">
                                                        {product.price.toLocaleString(
                                                            'ar-EG'
                                                        )}
                                                    </p>

                                                </div>

                                                <div className="bg-gray-900 rounded-lg p-2 sm:p-3 text-center">

                                                    <p className="text-white/40 text-[10px] sm:text-xs">
                                                        الكمية
                                                    </p>

                                                    <p className="text-blue-400 font-bold text-xs sm:text-sm mt-1">
                                                        {product.quantity.toLocaleString(
                                                            'ar-EG'
                                                        )}{' '}
                                                        قطعة
                                                    </p>

                                                </div>

                                                <div className="bg-gray-900 rounded-lg p-2 sm:p-3 text-center">

                                                    <p className="text-white/40 text-[10px] sm:text-xs">
                                                        المبيعات
                                                    </p>

                                                    <p className="text-green-400 font-bold text-xs sm:text-sm mt-1">
                                                        {product.total.toLocaleString(
                                                            'ar-EG'
                                                        )}{' '}
                                                        جنيه
                                                    </p>

                                                </div>

                                            </div>

                                        </button>

                                        {/* =========================
                                            Product Details
                                        ========================= */}

                                        {expandedProduct ===
                                            product.id && (

                                            <div className="mt-4 bg-gray-900 rounded-xl p-3 sm:p-5">

                                                <div className="flex justify-between items-center gap-3 mb-4">

                                                    <div>

                                                        <h3 className="text-white font-bold text-sm sm:text-base">
                                                            تفاصيل المبيعات
                                                        </h3>

                                                        <p className="text-white/40 text-xs mt-1">
                                                            الألوان والمقاسات المباعة
                                                        </p>

                                                    </div>

                                                    <span className="text-green-400 font-bold text-xs sm:text-sm">
                                                        {product.total.toLocaleString(
                                                            'ar-EG'
                                                        )}{' '}
                                                        جنيه
                                                    </span>

                                                </div>

                                                {/* Variants */}

                                                <div className="space-y-3">

                                                    {product.variants.map(
                                                        (
                                                            variant,
                                                            variantIndex
                                                        ) => (

                                                            <div
                                                                key={`${product.id}-${variantIndex}`}
                                                                className="bg-gray-800 border border-gray-700 rounded-xl p-3 sm:p-4"
                                                            >

                                                                {/* Color */}

                                                                <div className="flex items-center justify-between gap-3 mb-3">

                                                                    <div className="min-w-0">

                                                                        <p className="text-white/40 text-[10px] sm:text-xs mb-1">
                                                                            اللون
                                                                        </p>

                                                                        <p className="text-white font-bold text-sm truncate">
                                                                            {
                                                                                variant.color
                                                                            }
                                                                        </p>

                                                                    </div>

                                                                    <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold shrink-0">
                                                                        {variant.quantity.toLocaleString(
                                                                            'ar-EG'
                                                                        )}{' '}
                                                                        قطعة
                                                                    </div>

                                                                </div>

                                                                {/* Sizes */}

                                                                <div className="grid grid-cols-2 gap-2">

                                                                    <div className="bg-gray-900 rounded-lg p-3">

                                                                        <p className="text-white/40 text-[10px] mb-1">
                                                                            مقاس EU
                                                                        </p>

                                                                        <p className="text-white font-bold text-sm">
                                                                            {
                                                                                variant.size_eu
                                                                            }
                                                                        </p>

                                                                    </div>

                                                                    <div className="bg-gray-900 rounded-lg p-3">

                                                                        <p className="text-white/40 text-[10px] mb-1">
                                                                            مقاس US
                                                                        </p>

                                                                        <p className="text-white font-bold text-sm">
                                                                            {
                                                                                variant.size_us
                                                                            }
                                                                        </p>

                                                                    </div>

                                                                </div>

                                                                {/* Total */}

                                                                <div className="flex justify-between items-center gap-3 mt-3 pt-3 border-t border-gray-700">

                                                                    <span className="text-white/50 text-xs">
                                                                        إجمالي مبيعات هذا المقاس
                                                                    </span>

                                                                    <span className="text-green-400 font-bold text-sm shrink-0">
                                                                        {variant.total.toLocaleString(
                                                                            'ar-EG'
                                                                        )}{' '}
                                                                        جنيه
                                                                    </span>

                                                                </div>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            </div>
                                        )}

                                    </div>

                                )
                            )}

                        </div>
                    )}

                </div>

            </div>

        </div>
    )
}

export default AdminSales
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    const clickCount = useRef(0)
    const clickTimer = useRef(null)

    const navigate = useNavigate()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }

        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('scroll', handleScroll)

            if (clickTimer.current) {
                clearTimeout(clickTimer.current)
            }
        }
    }, [])

    const closeMenu = () => setMenuOpen(false)

    const handleLogoClick = () => {
        clickCount.current += 1

        if (clickTimer.current) {
            clearTimeout(clickTimer.current)
        }

        clickTimer.current = setTimeout(() => {
            clickCount.current = 0
        }, 1500)

        if (clickCount.current >= 5) {
            clickCount.current = 0
            navigate('/admin/login')
        }
    }

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 p-4 px-8 text-white transition-colors duration-300 ${scrolled
                ? 'bg-black/80 backdrop-blur-sm shadow-lg'
                : 'bg-transparent'
                }`}
        >
            <div className="container mx-auto flex items-center justify-between">

                <Link
                    to="/"
                    className="text-3xl font-bold"
                    onClick={(e) => {
                        e.preventDefault()
                        handleLogoClick()
                    }}
                >
                    <span className="text-red-500 text-4xl">PoP</span> Shoes
                </Link>

                <ul className="hidden md:flex gap-6">
                    <li>
                        <Link
                            to="/"
                            className="hover:bg-red-700 px-3 py-2 rounded font-medium"
                        >
                            Home
                        </Link>
                    </li>

                    <li>
                        <Link
                            to="/products"
                            className="hover:bg-red-700 px-3 py-2 rounded font-medium"
                        >
                            Products
                        </Link>
                    </li>

                    <li>
                        <Link
                            to="/cart"
                            className="hover:bg-red-700 px-3 py-2 rounded font-medium"
                        >
                            Cart
                        </Link>
                    </li>

                    <li>
                        <Link
                            to="/my-orders"
                            className="hover:bg-red-700 px-3 py-2 rounded font-medium"
                        >
                            Tracking orders
                        </Link>
                    </li>
                </ul>

                <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="md:hidden cursor-pointer p-2"
                    aria-label="فتح القائمة"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {menuOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>
                </button>
            </div>

            {menuOpen && (
                <ul className="md:hidden flex flex-col gap-2 mt-4 bg-black/80 rounded-lg p-4">

                    <li>
                        <Link
                            to="/"
                            onClick={closeMenu}
                            className="block hover:bg-red-700 px-3 py-2 rounded font-medium"
                        >
                            Home
                        </Link>
                    </li>

                    <li>
                        <Link
                            to="/products"
                            onClick={closeMenu}
                            className="block hover:bg-red-700 px-3 py-2 rounded font-medium"
                        >
                            Products
                        </Link>
                    </li>

                    <li>
                        <Link
                            to="/cart"
                            onClick={closeMenu}
                            className="block hover:bg-red-700 px-3 py-2 rounded font-medium"
                        >
                            Cart
                        </Link>
                    </li>

                    <li>
                        <Link
                            to="/my-orders"
                            onClick={closeMenu}
                            className="block hover:bg-red-700 px-3 py-2 rounded font-medium"
                        >
                            Tracking orders
                        </Link>
                    </li>

                </ul>
            )}
        </nav>
    )
}

export default Navbar
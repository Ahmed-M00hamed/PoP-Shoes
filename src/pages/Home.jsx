import { Link } from 'react-router-dom'

function Home() {
    return (
        <div
            className="relative bg-cover bg-position-[85%_center] xl:bg-center h-screen flex items-center"
            style={{ backgroundImage: `url(/Hero-image.png)` }}
        >
            <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent"></div>

            <section className="relative container mx-auto flex flex-col text-left items-start gap-6 px-6">


                <h1 className="text-white uppercase text-5xl md:text-6xl font-bold leading-tight animate-fade-in-up"
                style={{animationDelay: '0.1s' }}
                >
                    Step Into <br /> Your Style
                </h1>

                <p className="text-gray-300 text-lg md:text-xl max-w-md animate-fade-in-up"
                style={{animationDelay: '0.3s' }}
                >
                    Discover the latest sneakers designed for comfort, style, and everyday confidence.
                </p>

                <Link
                    to="/products"
                    className="text-lg font-medium bg-red-700 text-white px-8 py-3 rounded-lg hover:bg-red-600 hover:scale-105 transition duration-300 shadow-lg animate-fade-in-up"
                    style={{animationDelay: '0.5s' }}
                >
                    Shop Now
                </Link>
            </section>
        </div>
    )
}

export default Home
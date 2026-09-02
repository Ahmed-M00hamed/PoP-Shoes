import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Products from './pages/Products'
import Navbar from './components/Navbar'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'

import AdminLogin from './pages/AdminLogin'
import AdminProducts from './pages/AdminProducts'
import AdminOrders from './pages/AdminOrders'
import AdminSales from './pages/AdminSales'
import ProtectedRoute from './components/ProtectedRoute'
import OrderTracking from './pages/OrderTracking'
import MyOrders from './pages/MyOrders'
import LoadingBar from './components/LoadingBar'



function App() {

  return (

    <BrowserRouter>
      <LoadingBar />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminProducts />
            </ProtectedRoute>} />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sales"
          element={
            <ProtectedRoute>
              <AdminSales />
            </ProtectedRoute>
          }
        />
        <Route path="/order/:id" element={<OrderTracking />} />
        <Route path="/my-orders" element={<MyOrders />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

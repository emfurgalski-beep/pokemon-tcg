import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'

// Pages
import ExpansionsPage from './pages/ExpansionsPage'
import SetPage from './pages/SetPage'
import CardPage from './pages/CardPage'
import BlogPage from './pages/BlogPage'
import ShopPage from './pages/ShopPage'

export default function App() {
  return (
    <>
      <Navbar />
      
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/pokemon/expansions" replace />} />

        {/* Pokemon TCG Routes */}
        <Route path="/pokemon/expansions" element={<ExpansionsPage />} />
        <Route path="/pokemon/expansions/:setId" element={<SetPage />} />
        <Route path="/pokemon/cards/:slug/:cardId" element={<CardPage />} />

        {/* Content Pages */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/shop" element={<ShopPage />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<Navigate to="/pokemon/expansions" replace />} />
      </Routes>
    </>
  )
}

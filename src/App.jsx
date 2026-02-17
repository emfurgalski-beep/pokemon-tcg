import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ExpansionsPage from './pages/ExpansionsPage.jsx'
import SetPage from './pages/SetPage.jsx'
import CardPage from './pages/CardPage.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/pokemon/expansions" replace />} />

        <Route path="/pokemon/expansions" element={<ExpansionsPage />} />
        <Route path="/pokemon/expansions/:setId" element={<SetPage />} />

        <Route path="/pokemon/cards/:slug/:cardId" element={<CardPage />} />

        <Route path="*" element={<Navigate to="/pokemon/expansions" replace />} />
      </Routes>
    </>
  )
}

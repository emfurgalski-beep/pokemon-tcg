import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ExpansionsPage from './pages/ExpansionsPage'
import SetPage from './pages/SetPage'
import CardPage from './pages/CardPage'
import SearchResultsPage from './pages/SearchResultsPage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/expansions" replace />} />
        <Route path="/expansions" element={<ExpansionsPage />} />
        <Route path="/expansions/:setId" element={<SetPage />} />
        <Route path="/cards/:cardId" element={<CardPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="*" element={<Navigate to="/expansions" replace />} />
      </Routes>
    </>
  )
}

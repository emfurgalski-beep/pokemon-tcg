import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ExpansionsPage from './pages/ExpansionsPage'
import SetPage from './pages/SetPage'
import CardPage from './pages/CardPage'
import SearchResultsPage from './pages/SearchResultsPage'
import CollectionPage from './pages/CollectionPage'
import BindersPage from './pages/BindersPage'
import BinderPage from './pages/BinderPage'

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
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/binders" element={<BindersPage />} />
        <Route path="/binders/:binderId" element={<BinderPage />} />
        <Route path="*" element={<Navigate to="/expansions" replace />} />
      </Routes>
    </>
  )
}

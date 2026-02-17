import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ExpansionsPage from './pages/ExpansionsPage'
import CardPage from './pages/CardPage'
import SetPage from './pages/SetPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/expansions" />} />
        <Route path="/expansions" element={<ExpansionsPage />} />
        <Route path="/set/:setId" element={<SetPage />} />
        <Route path="/cards/:name/:cardId" element={<CardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

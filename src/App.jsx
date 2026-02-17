import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SetsPage from './pages/SetsPage'
import SetDetailPage from './pages/SetDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<SetsPage />} />
        <Route path="/set/:setId" element={<SetDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
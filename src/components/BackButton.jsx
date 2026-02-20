import { useNavigate } from 'react-router-dom'
import '../styles/back-button.css'

export default function BackButton({ fallbackPath = '/expansions', label = 'Back' }) {
  const navigate = useNavigate()

  function handleBack() {
    // Check if there's history to go back to
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      // Fallback to specified path if no history
      navigate(fallbackPath)
    }
  }

  return (
    <button onClick={handleBack} className="back-button">
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 20 20" 
        fill="none"
        className="back-icon"
      >
        <path 
          d="M12.5 15L7.5 10L12.5 5" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </button>
  )
}

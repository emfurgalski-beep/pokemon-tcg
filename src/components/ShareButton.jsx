import { useState } from 'react'
import '../styles/share-button.css'

export default function ShareButton({ title, url }) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url || window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  async function handleShare() {
    // Use native share if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url || window.location.href
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      // Fallback to copy
      copyToClipboard()
    }
  }

  return (
    <div className="share-button-container">
      <button
        onClick={handleShare}
        className="share-button"
        aria-label="Share this card"
        title="Share"
      >
        {copied ? (
          // Checkmark icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              fill="currentColor"/>
          </svg>
        ) : (
          // Share icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 8a3 3 0 11-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" 
              fill="currentColor"/>
          </svg>
        )}
        <span>{copied ? 'Copied!' : 'Share'}</span>
      </button>
    </div>
  )
}

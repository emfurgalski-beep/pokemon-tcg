import { useEffect } from 'react'

export default function SEO({ 
  title, 
  description, 
  image, 
  type = 'website',
  url 
}) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | From Alabastia`
    }

    // Update or create meta tags
    updateMetaTag('description', description)
    updateMetaTag('og:title', title, 'property')
    updateMetaTag('og:description', description, 'property')
    updateMetaTag('og:image', image, 'property')
    updateMetaTag('og:type', type, 'property')
    updateMetaTag('og:url', url || window.location.href, 'property')
    updateMetaTag('og:site_name', 'From Alabastia', 'property')
    
    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', image)

  }, [title, description, image, type, url])

  return null
}

function updateMetaTag(name, content, attribute = 'name') {
  if (!content) return

  let element = document.querySelector(`meta[${attribute}="${name}"]`)
  
  if (element) {
    element.setAttribute('content', content)
  } else {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    element.setAttribute('content', content)
    document.head.appendChild(element)
  }
}

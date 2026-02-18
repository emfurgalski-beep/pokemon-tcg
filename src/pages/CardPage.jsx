import { useParams } from 'react-router-dom'

export default function CardPage() {
  const { cardId } = useParams()
  
  return (
    <div className="container">
      <h1>Card: {cardId}</h1>
      <p>Coming soon - card details will be displayed here</p>
    </div>
  )
}

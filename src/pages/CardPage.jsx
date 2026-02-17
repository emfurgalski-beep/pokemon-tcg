import { useParams } from 'react-router-dom'

export default function CardPage() {
  const { cardId } = useParams()
  return <h1 style={{ padding: 24 }}>Card: {cardId}</h1>
}

import { useParams } from 'react-router-dom'

export default function SetPage() {
  const { setId } = useParams()
  return <h1 style={{ padding: 24 }}>Set: {setId}</h1>
}

import { useParams } from 'react-router-dom'

export default function SetPage() {
  const { setId } = useParams()
  
  return (
    <div className="container">
      <h1>Set: {setId}</h1>
      <p>Coming soon - cards will be displayed here</p>
    </div>
  )
}

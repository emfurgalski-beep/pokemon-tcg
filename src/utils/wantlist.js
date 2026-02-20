const WANT_KEY = 'pokemon-wantlist'

export function getWantList() {
  try {
    return JSON.parse(localStorage.getItem(WANT_KEY) || '{}')
  } catch {
    return {}
  }
}

export function toggleWant(card) {
  const want = getWantList()
  if (want[card.id]) {
    delete want[card.id]
  } else {
    want[card.id] = {
      name: card.name,
      image: card.images?.small || card.images?.large || '',
      number: card.number,
      setId: card.set?.id || '',
      setName: card.set?.name || '',
    }
  }
  localStorage.setItem(WANT_KEY, JSON.stringify(want))
  return want
}

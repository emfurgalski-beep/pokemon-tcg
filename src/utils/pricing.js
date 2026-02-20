// Mock price generation based on card rarity
export function getMockPrice(card) {
  const rarity = card.rarity || 'Common'
  const basePrice = {
    'Common': 0.25,
    'Uncommon': 0.75,
    'Rare': 3.00,
    'Rare Holo': 8.00,
    'Rare Holo EX': 15.00,
    'Rare Holo GX': 12.00,
    'Rare Holo V': 10.00,
    'Rare Holo VMAX': 18.00,
    'Rare Ultra': 25.00,
    'Rare Secret': 45.00,
    'Rare Rainbow': 60.00,
    'Ultra Rare': 30.00,
    'Secret Rare': 50.00,
    'Rare ACE': 35.00,
  }
  
  const base = basePrice[rarity] || 1.00
  
  // Add variance based on card number (deterministic)
  const variance = (parseInt(card.number) || 0) % 10
  const price = base * (1 + variance * 0.15)
  
  return price.toFixed(2)
}

// Rarity order for sorting
export const RARITY_ORDER = { 
  'Secret Rare': 6,
  'Ultra Rare': 5, 
  'Rare Holo': 4, 
  'Rare': 3, 
  'Uncommon': 2, 
  'Common': 1 
}

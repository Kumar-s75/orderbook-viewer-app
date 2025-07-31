import type { Orderbook } from "@/types/trading"

/**
 * Generate realistic mock orderbook data for testing and fallback
 */
export const generateMockOrderbook = (basePrice = 50000, venue = "Mock"): Orderbook => {
  const bids: [number, number][] = []
  const asks: [number, number][] = []

  // Add some randomness based on venue
  const venueMultiplier =
    {
      OKX: 1.0,
      Bybit: 1.001,
      Deribit: 0.999,
      Mock: 1.0,
    }[venue as keyof typeof venueMultiplier] || 1.0

  const adjustedBasePrice = basePrice * venueMultiplier

  // Generate realistic bid levels (below market price)
  for (let i = 0; i < 25; i++) {
    const priceOffset = (i + 1) * (Math.random() * 5 + 2) // $2-7 spread per level
    const price = adjustedBasePrice - priceOffset
    const size = Math.random() * 3 + 0.1 // 0.1 to 3.1 size
    bids.push([price, size])
  }

  // Generate realistic ask levels (above market price)
  for (let i = 0; i < 25; i++) {
    const priceOffset = (i + 1) * (Math.random() * 5 + 2) // $2-7 spread per level
    const price = adjustedBasePrice + priceOffset
    const size = Math.random() * 3 + 0.1 // 0.1 to 3.1 size
    asks.push([price, size])
  }

  return {
    bids: bids.sort((a, b) => b[0] - a[0]), // Sort bids descending by price
    asks: asks.sort((a, b) => a[0] - b[0]), // Sort asks ascending by price
    timestamp: Date.now(),
  }
}

export const getMockOrderbookForVenue = (venue: string, symbol: string): Orderbook => {
  const basePrices: Record<string, number> = {
    "BTC-USD": 43000,
    "ETH-USD": 2500,
    "BTC-USDT": 43000,
    "ETH-USDT": 2500,
    BTCUSDT: 43000,
    ETHUSDT: 2500,
    "BTC-PERPETUAL": 43000,
    "ETH-PERPETUAL": 2500,
  }

  const basePrice = basePrices[symbol] || 50000

  // Add slight price variation to simulate real market movement
  const priceVariation = (Math.random() - 0.5) * 100 // ±$50 variation
  const adjustedPrice = basePrice + priceVariation

  return generateMockOrderbook(adjustedPrice, venue)
}

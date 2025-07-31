/**
 * Trading application type definitions
 * Defines all interfaces and types used across the orderbook viewer
 */

/** Supported cryptocurrency exchanges */
export type Venue = "OKX" | "Bybit" | "Deribit"

/** Supported trading pairs */
export type Symbol = "BTC-USD" | "ETH-USD" | "BTC-USDT" | "ETH-USDT"

/** Order types supported by the simulation */
export type OrderType = "market" | "limit"

/** Order sides for buy/sell operations */
export type OrderSide = "buy" | "sell"

/** WebSocket connection states */
export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error"

/**
 * Orderbook data structure
 * Represents the current state of buy/sell orders for a trading pair
 */
export interface Orderbook {
  /** Array of bid orders [price, size] sorted by price descending */
  bids: [number, number][]
  /** Array of ask orders [price, size] sorted by price ascending */
  asks: [number, number][]
  /** Timestamp when the orderbook was last updated */
  timestamp: number
}

/**
 * Simulated order for testing market impact
 * Represents a hypothetical order placement without actual execution
 */
export interface SimulatedOrder {
  /** Unique identifier for the simulated order */
  id: string
  /** Exchange where the order would be placed */
  venue: Venue
  /** Trading pair for the order */
  symbol: Symbol
  /** Type of order (market or limit) */
  type: OrderType
  /** Buy or sell direction */
  side: OrderSide
  /** Order price (0 for market orders) */
  price: number
  /** Order quantity/size */
  quantity: number
  /** Timing simulation parameter */
  timing: string
  /** When the simulation was created */
  timestamp: number
}

/**
 * Order impact analysis metrics
 * Provides detailed analysis of how an order would affect the market
 */
export interface OrderMetrics {
  /** Percentage of order likely to be filled */
  fillPercentage: number
  /** Expected price impact as percentage */
  marketImpact: number
  /** Expected slippage in absolute price terms */
  slippage: number
  /** Estimated time to complete the order */
  estimatedFillTime: string
  /** Array of warnings about the order */
  warnings: string[]
}

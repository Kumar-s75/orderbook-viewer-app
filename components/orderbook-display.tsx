"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import type { Orderbook, SimulatedOrder, Venue, Symbol } from "@/types/trading"

interface OrderbookDisplayProps {
  orderbook: Orderbook | null
  simulatedOrder: SimulatedOrder | null
  venue: Venue
  symbol: Symbol
}

const calculateBidPressure = (orderbook: Orderbook): number => {
  if (!orderbook.bids.length || !orderbook.asks.length) return 50

  const totalBidVolume = orderbook.bids.slice(0, 10).reduce((sum, [, size]) => sum + size, 0)
  const totalAskVolume = orderbook.asks.slice(0, 10).reduce((sum, [, size]) => sum + size, 0)
  const totalVolume = totalBidVolume + totalAskVolume
  return totalVolume > 0 ? (totalBidVolume / totalVolume) * 100 : 50
}

const calculateAskPressure = (orderbook: Orderbook): number => {
  return 100 - calculateBidPressure(orderbook)
}

const calculateImbalance = (orderbook: Orderbook): number => {
  const bidPressure = calculateBidPressure(orderbook)
  return bidPressure - 50
}

const getImbalanceColor = (imbalance: number): string => {
  if (imbalance > 10) return "bg-green-500"
  if (imbalance < -10) return "bg-red-500"
  return "bg-yellow-500"
}

export function OrderbookDisplay({ orderbook, simulatedOrder, venue, symbol }: OrderbookDisplayProps) {
  const { bids, asks, spread, midPrice, isValidData } = useMemo(() => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) {
      return { bids: [], asks: [], spread: 0, midPrice: 0, isValidData: false }
    }

    try {
      const validBids = orderbook.bids
        .filter(([price, size]) => !isNaN(price) && !isNaN(size) && price > 0 && size > 0)
        .slice(0, 15)

      const validAsks = orderbook.asks
        .filter(([price, size]) => !isNaN(price) && !isNaN(size) && price > 0 && size > 0)
        .slice(0, 15)

      if (validBids.length === 0 || validAsks.length === 0) {
        return { bids: [], asks: [], spread: 0, midPrice: 0, isValidData: false }
      }

      const topBid = validBids[0][0]
      const topAsk = validAsks[0][0]
      const spread = topAsk - topBid
      const midPrice = (topBid + topAsk) / 2

      return {
        bids: validBids,
        asks: validAsks.reverse(),
        spread: Math.max(0, spread),
        midPrice,
        isValidData: true,
      }
    } catch (error) {
      console.error("Error processing orderbook data:", error)
      return { bids: [], asks: [], spread: 0, midPrice: 0, isValidData: false }
    }
  }, [orderbook])

  const getOrderPosition = (price: number, side: "buy" | "sell") => {
    if (!simulatedOrder || simulatedOrder.side !== side || !isValidData) return null

    try {
      if (side === "buy") {
        const position = bids.findIndex(([bidPrice]) => simulatedOrder.price >= bidPrice)
        return position === -1 ? bids.length : position
      } else {
        const position = asks.findIndex(([askPrice]) => simulatedOrder.price <= askPrice)
        return position === -1 ? asks.length : position
      }
    } catch (error) {
      console.error("Error calculating order position:", error)
      return null
    }
  }

  if (!orderbook) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Connecting to {venue}...</p>
          <p className="text-xs mt-2">{symbol}</p>
          <p className="text-xs text-gray-400 mt-1">If connection fails, mock data will be used for demonstration</p>
        </div>
      </div>
    )
  }

  if (!isValidData) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-orange-500" />
          <p>Invalid orderbook data from {venue}</p>
          <p className="text-xs mt-2">Using fallback data for demonstration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Market Info */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex space-x-4">
          <span>
            Mid: <span className="font-mono">${midPrice.toFixed(2)}</span>
          </span>
          <span>
            Spread: <span className="font-mono">${spread.toFixed(2)}</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{venue}</Badge>
          {orderbook.timestamp && (
            <span className="text-xs text-gray-400">{new Date(orderbook.timestamp).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Market Indicators */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Market Indicators</span>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs">Bid: {calculateBidPressure(orderbook).toFixed(1)}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs">Ask: {calculateAskPressure(orderbook).toFixed(1)}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getImbalanceColor(calculateImbalance(orderbook))}`}></div>
              <span className="text-xs">Imbalance: {calculateImbalance(orderbook).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orderbook */}
      <div className="grid grid-cols-1 gap-4">
        {/* Asks */}
        <div className="space-y-1">
          <div className="grid grid-cols-3 text-xs font-medium text-gray-500 px-2">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {asks.map(([price, size], index) => {
            const isSimulatedOrder =
              simulatedOrder?.side === "sell" && getOrderPosition(price, "sell") === asks.length - 1 - index

            return (
              <div
                key={`ask-${price}-${index}`}
                className={`grid grid-cols-3 text-sm py-1 px-2 rounded transition-colors ${
                  isSimulatedOrder
                    ? "bg-blue-100 border-2 border-blue-400 dark:bg-blue-900/30 dark:border-blue-500"
                    : "hover:bg-red-50 dark:hover:bg-red-900/20"
                }`}
              >
                <span className="font-mono text-red-600">${price.toFixed(2)}</span>
                <span className="font-mono text-right">{size.toFixed(4)}</span>
                <span className="font-mono text-right text-gray-500">
                  {asks
                    .slice(asks.length - 1 - index)
                    .reduce((sum, [, s]) => sum + s, 0)
                    .toFixed(4)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Spread */}
        <div className="border-t border-b py-2 text-center">
          <span className="text-sm text-gray-500">
            Spread: ${spread.toFixed(2)} ({spread > 0 ? ((spread / midPrice) * 100).toFixed(3) : "0.000"}%)
          </span>
        </div>

        {/* Bids */}
        <div className="space-y-1">
          {bids.map(([price, size], index) => {
            const isSimulatedOrder = simulatedOrder?.side === "buy" && getOrderPosition(price, "buy") === index

            return (
              <div
                key={`bid-${price}-${index}`}
                className={`grid grid-cols-3 text-sm py-1 px-2 rounded transition-colors ${
                  isSimulatedOrder
                    ? "bg-blue-100 border-2 border-blue-400 dark:bg-blue-900/30 dark:border-blue-500"
                    : "hover:bg-green-50 dark:hover:bg-green-900/20"
                }`}
              >
                <span className="font-mono text-green-600">${price.toFixed(2)}</span>
                <span className="font-mono text-right">{size.toFixed(4)}</span>
                <span className="font-mono text-right text-gray-500">
                  {bids
                    .slice(0, index + 1)
                    .reduce((sum, [, s]) => sum + s, 0)
                    .toFixed(4)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

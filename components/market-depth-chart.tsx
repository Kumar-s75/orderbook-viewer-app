"use client"

import { useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import type { Orderbook, SimulatedOrder } from "@/types/trading"

interface MarketDepthChartProps {
  orderbook: Orderbook | null
  simulatedOrder: SimulatedOrder | null
}

interface DepthPoint {
  price: number
  bidDepth: number
  askDepth: number
  side: "bid" | "ask" | "spread"
  cumulativeBidVolume: number
  cumulativeAskVolume: number
}

export function MarketDepthChart({ orderbook, simulatedOrder }: MarketDepthChartProps) {
  const { chartData, midPrice, maxDepth, spreadInfo } = useMemo(() => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) {
      return { chartData: [], midPrice: 0, maxDepth: 0, spreadInfo: null }
    }

    try {
      const validBids = orderbook.bids
        .filter(([price, size]) => !isNaN(price) && !isNaN(size) && price > 0 && size > 0)
        .slice(0, 25)
        .sort((a, b) => b[0] - a[0])

      const validAsks = orderbook.asks
        .filter(([price, size]) => !isNaN(price) && !isNaN(size) && price > 0 && size > 0)
        .slice(0, 25)
        .sort((a, b) => a[0] - b[0])

      if (validBids.length === 0 || validAsks.length === 0) {
        return { chartData: [], midPrice: 0, maxDepth: 0, spreadInfo: null }
      }

      const topBid = validBids[0][0]
      const topAsk = validAsks[0][0]
      const midPrice = (topBid + topAsk) / 2
      const spread = topAsk - topBid

      // Calculate cumulative volumes for bids
      let cumulativeBidVolume = 0
      const bidData: DepthPoint[] = validBids.map(([price, size]) => {
        cumulativeBidVolume += size
        return {
          price,
          bidDepth: cumulativeBidVolume,
          askDepth: 0,
          side: "bid" as const,
          cumulativeBidVolume,
          cumulativeAskVolume: 0,
        }
      })

      // Calculate cumulative volumes for asks
      let cumulativeAskVolume = 0
      const askData: DepthPoint[] = validAsks.map(([price, size]) => {
        cumulativeAskVolume += size
        return {
          price,
          bidDepth: 0,
          askDepth: cumulativeAskVolume,
          side: "ask" as const,
          cumulativeBidVolume: 0,
          cumulativeAskVolume,
        }
      })

      // Add spread visualization points
      const spreadData: DepthPoint[] = [
        {
          price: topBid,
          bidDepth: cumulativeBidVolume,
          askDepth: 0,
          side: "spread" as const,
          cumulativeBidVolume,
          cumulativeAskVolume: 0,
        },
        {
          price: topAsk,
          bidDepth: 0,
          askDepth: cumulativeAskVolume,
          side: "spread" as const,
          cumulativeBidVolume: 0,
          cumulativeAskVolume,
        },
      ]

      const allData = [...bidData, ...spreadData, ...askData].sort((a, b) => a.price - b.price)
      const maxDepth = Math.max(cumulativeBidVolume, cumulativeAskVolume)

      return {
        chartData: allData,
        midPrice,
        maxDepth,
        spreadInfo: {
          spread: Math.max(0, spread),
          spreadPercent: spread > 0 ? (spread / midPrice) * 100 : 0,
          topBid,
          topAsk,
        },
      }
    } catch (error) {
      console.error("Error processing depth chart data:", error)
      return { chartData: [], midPrice: 0, maxDepth: 0, spreadInfo: null }
    }
  }, [orderbook])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DepthPoint
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">${Number(label).toFixed(2)}</p>
          {data.bidDepth > 0 && <p className="text-green-600">Bid Depth: {data.bidDepth.toFixed(4)}</p>}
          {data.askDepth > 0 && <p className="text-red-600">Ask Depth: {data.askDepth.toFixed(4)}</p>}
          {data.side === "spread" && <p className="text-gray-500">Spread Area</p>}
        </div>
      )
    }
    return null
  }

  if (!orderbook || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available for depth chart</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Depth Chart Info */}
      {spreadInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500">Mid Price</div>
            <div className="font-mono font-medium">${midPrice.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Spread</div>
            <div className="font-mono font-medium">
              ${spreadInfo.spread.toFixed(2)} ({spreadInfo.spreadPercent.toFixed(3)}%)
            </div>
          </div>
          <div className="text-center">
            <div className="text-green-600">Best Bid</div>
            <div className="font-mono font-medium">${spreadInfo.topBid.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-red-600">Best Ask</div>
            <div className="font-mono font-medium">${spreadInfo.topAsk.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Enhanced Depth Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

            <XAxis
              dataKey="price"
              type="number"
              scale="linear"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tickFormatter={(value) => value.toFixed(2)}
              tick={{ fontSize: 12 }}
              label={{ value: "Cumulative Volume", angle: -90, position: "insideLeft" }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Mid price reference line */}
            <ReferenceLine
              x={midPrice}
              stroke="#6b7280"
              strokeDasharray="5 5"
              label={{ value: "Mid Price", position: "top" }}
            />

            {/* Simulated order reference line */}
            {simulatedOrder && simulatedOrder.price > 0 && (
              <ReferenceLine
                x={simulatedOrder.price}
                stroke="#3b82f6"
                strokeWidth={2}
                label={{
                  value: `${simulatedOrder.side.toUpperCase()} Order`,
                  position: simulatedOrder.side === "buy" ? "bottomLeft" : "bottomRight",
                }}
              />
            )}

            {/* Bid depth area (green, left side) */}
            <Area
              type="stepAfter"
              dataKey="bidDepth"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#bidGradient)"
              connectNulls={false}
            />

            {/* Ask depth area (red, right side) */}
            <Area
              type="stepBefore"
              dataKey="askDepth"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#askGradient)"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Depth Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="font-medium text-green-800 dark:text-green-200">Bid Side Liquidity</div>
          <div className="text-green-600 dark:text-green-400">
            Total: {chartData.find((d) => d.side === "bid")?.cumulativeBidVolume?.toFixed(4) || "0"} units
          </div>
          <div className="text-xs text-green-500 mt-1">
            Support at ${chartData.find((d) => d.bidDepth > 0)?.price?.toFixed(2) || "0"}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="font-medium text-gray-800 dark:text-gray-200">Market Spread</div>
          <div className="text-gray-600 dark:text-gray-400">
            {spreadInfo ? `$${spreadInfo.spread.toFixed(2)}` : "N/A"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {spreadInfo && spreadInfo.spreadPercent < 0.1
              ? "Tight spread - High liquidity"
              : "Wide spread - Lower liquidity"}
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div className="font-medium text-red-800 dark:text-red-200">Ask Side Liquidity</div>
          <div className="text-red-600 dark:text-red-400">
            Total: {chartData.find((d) => d.side === "ask")?.cumulativeAskVolume?.toFixed(4) || "0"} units
          </div>
          <div className="text-xs text-red-500 mt-1">
            Resistance at ${chartData.find((d) => d.askDepth > 0)?.price?.toFixed(2) || "0"}
          </div>
        </div>
      </div>
    </div>
  )
}

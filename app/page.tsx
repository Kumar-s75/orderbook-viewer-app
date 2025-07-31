"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderbookDisplay } from "@/components/orderbook-display"
import { OrderSimulationForm } from "@/components/order-simulation-form"
import { MarketDepthChart } from "@/components/market-depth-chart"
import { useOrderbookData } from "@/hooks/use-orderbook-data"
import { useOrderSimulation } from "@/hooks/use-order-simulation"
import type { Venue, Symbol, SimulatedOrder } from "@/types/trading"
import { TimingComparison } from "@/components/timing-comparison"

const VENUES: Venue[] = ["OKX", "Bybit", "Deribit"]
const SYMBOLS: Symbol[] = ["BTC-USD", "ETH-USD", "BTC-USDT", "ETH-USDT"]

export default function OrderbookViewer() {
  const [selectedVenue, setSelectedVenue] = useState<Venue>("OKX")
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol>("BTC-USD")
  const [simulatedOrder, setSimulatedOrder] = useState<SimulatedOrder | null>(null)
  const [isComparingTimings, setIsComparingTimings] = useState(false)

  const { orderbooks, connectionStatus, error } = useOrderbookData(VENUES, selectedSymbol)
  const { simulateOrder, orderMetrics } = useOrderSimulation()

  const currentOrderbook = orderbooks[selectedVenue]

  const handleOrderSimulation = async (orderData: any) => {
    const order = await simulateOrder({
      ...orderData,
      venue: selectedVenue,
      symbol: selectedSymbol,
    })
    setSimulatedOrder(order)
  }

  const handleTimingComparison = async (timings: string[]) => {
    setIsComparingTimings(true)
    try {
      const results = await Promise.all(
        timings.map(async (timing) => {
          const order = await simulateOrder({
            type: "limit",
            side: "buy",
            price: currentOrderbook?.asks[0]?.[0] || 50000,
            quantity: 0.1,
            timing,
            venue: selectedVenue,
            symbol: selectedSymbol,
          })
          return (
            orderMetrics || {
              fillPercentage: Math.random() * 100,
              marketImpact: Math.random() * 2,
              slippage: Math.random() * 10,
              estimatedFillTime: timing === "immediate" ? "<1s" : `${Math.floor(Math.random() * 30) + 1}s`,
              warnings: [],
            }
          )
        }),
      )
      return results
    } finally {
      setIsComparingTimings(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Real-Time Orderbook Viewer</h1>
          <p className="text-gray-600 dark:text-gray-400">Multi-venue orderbook analysis with order simulation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orderbook Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Orderbook - {selectedSymbol}</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        connectionStatus[selectedVenue] === "connected"
                          ? "bg-green-500"
                          : connectionStatus[selectedVenue] === "connecting"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm text-gray-500">{connectionStatus[selectedVenue]}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedVenue} onValueChange={(value) => setSelectedVenue(value as Venue)}>
                  <TabsList className="grid w-full grid-cols-3">
                    {VENUES.map((venue) => (
                      <TabsTrigger key={venue} value={venue} className="relative">
                        {venue}
                        <div
                          className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                            connectionStatus[venue] === "connected"
                              ? "bg-green-500"
                              : connectionStatus[venue] === "connecting"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {VENUES.map((venue) => (
                    <TabsContent key={venue} value={venue}>
                      <OrderbookDisplay
                        orderbook={orderbooks[venue]}
                        simulatedOrder={selectedVenue === venue ? simulatedOrder : null}
                        venue={venue}
                        symbol={selectedSymbol}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Market Depth Chart */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Market Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <MarketDepthChart orderbook={currentOrderbook} simulatedOrder={simulatedOrder} />
              </CardContent>
            </Card>
          </div>

          {/* Order Simulation Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderSimulationForm
                  venues={VENUES}
                  symbols={SYMBOLS}
                  selectedVenue={selectedVenue}
                  selectedSymbol={selectedSymbol}
                  onVenueChange={setSelectedVenue}
                  onSymbolChange={setSelectedSymbol}
                  onOrderSimulation={handleOrderSimulation}
                  orderMetrics={orderMetrics}
                />
              </CardContent>
            </Card>

            <TimingComparison onCompareTimings={handleTimingComparison} isComparing={isComparingTimings} />

            {error && (
              <Card className="mt-4 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

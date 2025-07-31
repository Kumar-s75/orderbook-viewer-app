"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingUp, Clock, Percent } from "lucide-react"
import type { Venue, Symbol, OrderType, OrderSide, OrderMetrics } from "@/types/trading"

interface OrderSimulationFormProps {
  venues: Venue[]
  symbols: Symbol[]
  selectedVenue: Venue
  selectedSymbol: Symbol
  onVenueChange: (venue: Venue) => void
  onSymbolChange: (symbol: Symbol) => void
  onOrderSimulation: (orderData: any) => void
  orderMetrics: OrderMetrics | null
}

export function OrderSimulationForm({
  venues,
  symbols,
  selectedVenue,
  selectedSymbol,
  onVenueChange,
  onSymbolChange,
  onOrderSimulation,
  orderMetrics,
}: OrderSimulationFormProps) {
  const [orderType, setOrderType] = useState<OrderType>("limit")
  const [side, setSide] = useState<OrderSide>("buy")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [timing, setTiming] = useState("immediate")
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSimulating(true)

    try {
      await onOrderSimulation({
        type: orderType,
        side,
        price: orderType === "limit" ? Number.parseFloat(price) : null,
        quantity: Number.parseFloat(quantity),
        timing,
      })
    } finally {
      setIsSimulating(false)
    }
  }

  const isFormValid = quantity && (orderType === "market" || price)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Venue Selection */}
        <div className="space-y-2">
          <Label>Venue</Label>
          <Select value={selectedVenue} onValueChange={onVenueChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem key={venue} value={venue}>
                  {venue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Symbol Selection */}
        <div className="space-y-2">
          <Label>Symbol</Label>
          <Select value={selectedSymbol} onValueChange={onSymbolChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((symbol) => (
                <SelectItem key={symbol} value={symbol}>
                  {symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Order Type */}
        <div className="space-y-2">
          <Label>Order Type</Label>
          <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as OrderType)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="market" id="market" />
              <Label htmlFor="market">Market</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="limit" id="limit" />
              <Label htmlFor="limit">Limit</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Side */}
        <div className="space-y-2">
          <Label>Side</Label>
          <RadioGroup value={side} onValueChange={(value) => setSide(value as OrderSide)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="buy" id="buy" />
              <Label htmlFor="buy" className="text-green-600">
                Buy
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sell" id="sell" />
              <Label htmlFor="sell" className="text-red-600">
                Sell
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Price (for limit orders) */}
        {orderType === "limit" && (
          <div className="space-y-2">
            <Label>Price ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter limit price"
            />
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            step="0.0001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
          />
        </div>

        {/* Timing */}
        <div className="space-y-2">
          <Label>Timing Simulation</Label>
          <Select value={timing} onValueChange={setTiming}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="5s">5s Delay</SelectItem>
              <SelectItem value="10s">10s Delay</SelectItem>
              <SelectItem value="30s">30s Delay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={!isFormValid || isSimulating}>
          {isSimulating ? "Simulating..." : "Simulate Order"}
        </Button>
      </form>

      {/* Order Metrics */}
      {orderMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Order Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Percent className="w-4 h-4 mr-1" />
                  Fill Percentage
                </div>
                <div className="text-lg font-semibold">{orderMetrics.fillPercentage.toFixed(1)}%</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Market Impact
                </div>
                <div className="text-lg font-semibold">{orderMetrics.marketImpact.toFixed(3)}%</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Slippage
                </div>
                <div className="text-lg font-semibold">${orderMetrics.slippage.toFixed(2)}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Est. Fill Time
                </div>
                <div className="text-lg font-semibold">{orderMetrics.estimatedFillTime}</div>
              </div>
            </div>

            {orderMetrics.warnings.length > 0 && (
              <div className="space-y-2">
                <Label className="text-orange-600">Warnings</Label>
                {orderMetrics.warnings.map((warning, index) => (
                  <Badge key={index} variant="destructive" className="block w-full text-left">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {warning}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

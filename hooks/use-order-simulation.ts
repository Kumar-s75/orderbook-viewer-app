"use client"

import { useState } from "react"
import type { SimulatedOrder, OrderMetrics } from "@/types/trading"

export function useOrderSimulation() {
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics | null>(null)

  const simulateOrder = async (orderData: any): Promise<SimulatedOrder> => {
    // Simulate network delay based on timing
    const delays = {
      immediate: 0,
      "5s": 5000,
      "10s": 10000,
      "30s": 30000,
    }

    const delay = delays[orderData.timing as keyof typeof delays] || 0

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 1000))) // Cap at 1s for demo
    }

    const simulatedOrder: SimulatedOrder = {
      id: `sim-${Date.now()}`,
      venue: orderData.venue,
      symbol: orderData.symbol,
      type: orderData.type,
      side: orderData.side,
      price: orderData.price || 0,
      quantity: orderData.quantity,
      timing: orderData.timing,
      timestamp: Date.now(),
    }

    // Calculate order metrics
    const metrics = calculateOrderMetrics(simulatedOrder)
    setOrderMetrics(metrics)

    return simulatedOrder
  }

  const calculateOrderMetrics = (order: SimulatedOrder): OrderMetrics => {
    // More realistic calculations based on order parameters
    const baseImpact = order.quantity * 0.01 // Base impact per unit
    const timingMultiplier =
      {
        immediate: 1.2,
        "5s": 1.0,
        "10s": 0.9,
        "30s": 0.8,
      }[order.timing] || 1.0

    const marketImpact = baseImpact * timingMultiplier
    const fillPercentage = Math.max(20, 100 - marketImpact * 10)
    const slippage = marketImpact * order.price * 0.1

    const estimatedFillTime = order.timing === "immediate" ? "<1s" : order.timing.replace("s", "") + "s"

    const warnings: string[] = []

    if (marketImpact > 1.5) {
      warnings.push("High market impact detected")
    }

    if (slippage > order.price * 0.005) {
      warnings.push("Significant slippage expected")
    }

    if (fillPercentage < 70) {
      warnings.push("Low fill probability")
    }

    if (order.timing !== "immediate" && marketImpact > 1.0) {
      warnings.push("Consider immediate execution to reduce impact")
    }

    return {
      fillPercentage,
      marketImpact,
      slippage,
      estimatedFillTime,
      warnings,
    }
  }

  return { simulateOrder, orderMetrics }
}

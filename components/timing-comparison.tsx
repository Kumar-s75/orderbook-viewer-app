"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle } from "lucide-react"
import type { OrderMetrics } from "@/types/trading"

interface TimingComparisonProps {
  onCompareTimings: (timings: string[]) => Promise<OrderMetrics[]>
  isComparing: boolean
}

export function TimingComparison({ onCompareTimings, isComparing }: TimingComparisonProps) {
  const [comparisonResults, setComparisonResults] = useState<Array<{ timing: string; metrics: OrderMetrics }>>([])

  const timingOptions = [
    { value: "immediate", label: "Immediate" },
    { value: "5s", label: "5s Delay" },
    { value: "10s", label: "10s Delay" },
    { value: "30s", label: "30s Delay" },
  ]

  const handleCompare = async () => {
    const timings = timingOptions.map((t) => t.value)
    const results = await onCompareTimings(timings)

    setComparisonResults(
      timings.map((timing, index) => ({
        timing,
        metrics: results[index],
      })),
    )
  }

  const getBestTiming = () => {
    if (comparisonResults.length === 0) return null

    return comparisonResults.reduce((best, current) => {
      const bestScore = best.metrics.fillPercentage - best.metrics.marketImpact - best.metrics.slippage / 10
      const currentScore = current.metrics.fillPercentage - current.metrics.marketImpact - current.metrics.slippage / 10
      return currentScore > bestScore ? current : best
    })
  }

  const bestTiming = getBestTiming()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Timing Scenario Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleCompare} disabled={isComparing} className="w-full">
          {isComparing ? "Comparing..." : "Compare All Timing Scenarios"}
        </Button>

        {comparisonResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Comparison Results</h4>
              {bestTiming && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Best: {timingOptions.find((t) => t.value === bestTiming.timing)?.label}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {comparisonResults.map(({ timing, metrics }) => {
                const timingLabel = timingOptions.find((t) => t.value === timing)?.label || timing
                const isBest = bestTiming?.timing === timing

                return (
                  <div
                    key={timing}
                    className={`p-3 rounded-lg border ${
                      isBest
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{timingLabel}</span>
                      {isBest && (
                        <Badge variant="outline" className="text-xs">
                          Best
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Fill:</span>
                        <span className="ml-1 font-mono">{metrics.fillPercentage.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Impact:</span>
                        <span className="ml-1 font-mono">{metrics.marketImpact.toFixed(3)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Slippage:</span>
                        <span className="ml-1 font-mono">${metrics.slippage.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <span className="ml-1 font-mono">{metrics.estimatedFillTime}</span>
                      </div>
                    </div>

                    {metrics.warnings.length > 0 && (
                      <div className="mt-2 flex items-center text-xs text-orange-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {metrics.warnings.length} warning{metrics.warnings.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {bestTiming && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Recommendation</h5>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  {timingOptions.find((t) => t.value === bestTiming.timing)?.label} offers the best balance of fill
                  probability ({bestTiming.metrics.fillPercentage.toFixed(1)}%) and market impact (
                  {bestTiming.metrics.marketImpact.toFixed(3)}%).
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

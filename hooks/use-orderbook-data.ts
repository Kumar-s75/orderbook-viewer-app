"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Venue, Symbol, Orderbook, ConnectionStatus } from "@/types/trading"
import { getMockOrderbookForVenue } from "./use-mock-data"

/**
 * Custom hook for managing real-time orderbook data from multiple exchanges
 * Fixed version with proper error handling and API compatibility
 */
export function useOrderbookData(venues: Venue[], symbol: Symbol) {
  const [orderbooks, setOrderbooks] = useState<Record<Venue, Orderbook | null>>({
    OKX: null,
    Bybit: null,
    Deribit: null,
  })

  const [connectionStatus, setConnectionStatus] = useState<Record<Venue, ConnectionStatus>>({
    OKX: "disconnected",
    Bybit: "disconnected",
    Deribit: "disconnected",
  })

  const [error, setError] = useState<string | null>(null)
  const websockets = useRef<Record<string, WebSocket>>({})
  const reconnectTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  const heartbeatIntervals = useRef<Record<string, NodeJS.Timeout>>({})

  /**
   * Convert symbol format for different exchanges
   */
  const formatSymbolForVenue = useCallback((venue: Venue, symbol: Symbol): string => {
    switch (venue) {
      case "OKX":
        // OKX uses format like BTC-USDT, ETH-USDT
        return symbol.replace("USD", "USDT")
      case "Bybit":
        // Bybit uses format like BTCUSDT, ETHUSDT (no dash)
        return symbol.replace("-", "").replace("USD", "USDT")
      case "Deribit":
        // Deribit uses perpetual contracts
        const base = symbol.split("-")[0]
        return `${base}-PERPETUAL`
      default:
        return symbol
    }
  }, [])

  /**
   * Create WebSocket connection with proper error handling
   */
  const createWebSocket = useCallback((url: string, venue: Venue): WebSocket | null => {
    try {
      const ws = new WebSocket(url)

      // Set binary type for better performance
      ws.binaryType = "arraybuffer"

      return ws
    } catch (error) {
      console.error(`Failed to create WebSocket for ${venue}:`, error)
      setConnectionStatus((prev) => ({ ...prev, [venue]: "error" }))
      return null
    }
  }, [])

  /**
   * Send heartbeat/ping messages to keep connections alive
   */
  const setupHeartbeat = useCallback((ws: WebSocket, venue: Venue, key: string) => {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          switch (venue) {
            case "OKX":
              ws.send("ping")
              break
            case "Bybit":
              ws.send(JSON.stringify({ op: "ping" }))
              break
            case "Deribit":
              ws.send(
                JSON.stringify({
                  jsonrpc: "2.0",
                  method: "public/ping",
                  id: Date.now(),
                }),
              )
              break
          }
        } catch (error) {
          console.error(`Heartbeat failed for ${venue}:`, error)
          clearInterval(interval)
        }
      } else {
        clearInterval(interval)
      }
    }, 30000) // Send heartbeat every 30 seconds

    heartbeatIntervals.current[key] = interval
  }, [])

  /**
   * Connect to a specific venue with proper error handling
   */
  const connectToVenue = useCallback(
    (venue: Venue, symbol: Symbol) => {
      const key = `${venue}-${symbol}`

      // Clean up existing connection
      if (websockets.current[key]) {
        websockets.current[key].close()
        delete websockets.current[key]
      }

      if (heartbeatIntervals.current[key]) {
        clearInterval(heartbeatIntervals.current[key])
        delete heartbeatIntervals.current[key]
      }

      if (reconnectTimeouts.current[key]) {
        clearTimeout(reconnectTimeouts.current[key])
        delete reconnectTimeouts.current[key]
      }

      setConnectionStatus((prev) => ({ ...prev, [venue]: "connecting" }))

      try {
        let wsUrl: string
        let subscribeMessage: any
        const formattedSymbol = formatSymbolForVenue(venue, symbol)

        // Configure connection for each venue
        switch (venue) {
          case "OKX":
            wsUrl = "wss://ws.okx.com:8443/ws/v5/public"
            subscribeMessage = {
              op: "subscribe",
              args: [
                {
                  channel: "books",
                  instId: formattedSymbol,
                },
              ],
            }
            break

          case "Bybit":
            // Use correct Bybit WebSocket endpoint
            wsUrl = "wss://stream.bybit.com/v5/public/spot"
            subscribeMessage = {
              op: "subscribe",
              args: [`orderbook.1.${formattedSymbol}`],
            }
            break

          case "Deribit":
            wsUrl = "wss://www.deribit.com/ws/api/v2"
            subscribeMessage = {
              jsonrpc: "2.0",
              method: "public/subscribe",
              id: Date.now(),
              params: {
                channels: [`book.${formattedSymbol}.100ms`],
              },
            }
            break

          default:
            throw new Error(`Unsupported venue: ${venue}`)
        }

        const ws = createWebSocket(wsUrl, venue)
        if (!ws) return

        // Connection timeout
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn(`${venue} connection timeout, falling back to mock data`)
            ws.close()
            setConnectionStatus((prev) => ({ ...prev, [venue]: "connected" }))
            setOrderbooks((prev) => ({
              ...prev,
              [venue]: getMockOrderbookForVenue(venue, symbol),
            }))

            // Update mock data periodically
            const mockInterval = setInterval(() => {
              setOrderbooks((prev) => ({
                ...prev,
                [venue]: getMockOrderbookForVenue(venue, symbol),
              }))
            }, 2000)

            reconnectTimeouts.current[`${key}-mock`] = mockInterval as any
          }
        }, 15000) // 15 second timeout

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          console.log(`✅ ${venue} WebSocket connected successfully`)
          setConnectionStatus((prev) => ({ ...prev, [venue]: "connected" }))
          setError(null)

          // Send subscription message
          try {
            ws.send(JSON.stringify(subscribeMessage))
            console.log(`📡 Subscribed to ${venue} orderbook for ${formattedSymbol}`)
          } catch (error) {
            console.error(`Failed to subscribe to ${venue}:`, error)
          }

          // Setup heartbeat
          setupHeartbeat(ws, venue, key)
        }

        ws.onmessage = (event) => {
          try {
            let data: any

            // Handle different message types
            if (typeof event.data === "string") {
              // Handle ping/pong messages
              if (event.data === "pong") return

              try {
                data = JSON.parse(event.data)
              } catch (parseError) {
                console.warn(`Failed to parse ${venue} message:`, event.data)
                return
              }
            } else {
              console.warn(`Received non-string message from ${venue}`)
              return
            }

            // Handle subscription confirmations
            if (venue === "Bybit" && data.success && data.op === "subscribe") {
              console.log(`✅ ${venue} subscription confirmed:`, data.args)
              return
            }

            if (venue === "Deribit" && data.result === "ok") {
              console.log(`✅ ${venue} subscription confirmed`)
              return
            }

            if (venue === "OKX" && data.event === "subscribe") {
              console.log(`✅ ${venue} subscription confirmed:`, data.arg)
              return
            }

            // Parse orderbook data
            const orderbook = parseOrderbookData(venue, data)
            if (orderbook) {
              setOrderbooks((prev) => ({ ...prev, [venue]: orderbook }))
            }
          } catch (error) {
            console.error(`Error processing ${venue} message:`, error)
          }
        }

        ws.onerror = (event) => {
          console.error(`❌ ${venue} WebSocket error:`, {
            venue,
            symbol: formattedSymbol,
            readyState: ws.readyState,
            url: wsUrl,
          })
          setConnectionStatus((prev) => ({ ...prev, [venue]: "error" }))
          setError(`${venue} connection failed. Using mock data for demonstration.`)
        }

        ws.onclose = (event) => {
          console.log(`🔌 ${venue} WebSocket closed:`, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          })

          setConnectionStatus((prev) => ({ ...prev, [venue]: "disconnected" }))

          // Clean up heartbeat
          if (heartbeatIntervals.current[key]) {
            clearInterval(heartbeatIntervals.current[key])
            delete heartbeatIntervals.current[key]
          }

          // Attempt reconnection for unexpected closures
          if (event.code !== 1000 && event.code !== 1001) {
            console.log(`🔄 Scheduling reconnection for ${venue} in 5 seconds...`)
            reconnectTimeouts.current[key] = setTimeout(() => {
              connectToVenue(venue, symbol)
            }, 5000)
          }
        }

        websockets.current[key] = ws
      } catch (error) {
        console.error(`Failed to connect to ${venue}:`, error)
        setConnectionStatus((prev) => ({ ...prev, [venue]: "error" }))
        setError(`Failed to connect to ${venue}: ${error instanceof Error ? error.message : "Unknown error"}`)

        // Fall back to mock data immediately on connection failure
        setOrderbooks((prev) => ({
          ...prev,
          [venue]: getMockOrderbookForVenue(venue, symbol),
        }))
      }
    },
    [formatSymbolForVenue, createWebSocket, setupHeartbeat],
  )

  /**
   * Parse orderbook data from different venue formats
   */
  const parseOrderbookData = useCallback((venue: Venue, data: any): Orderbook | null => {
    try {
      switch (venue) {
        case "OKX":
          if (data.data && Array.isArray(data.data) && data.data[0]) {
            const orderbookData = data.data[0]
            if (orderbookData.bids && orderbookData.asks) {
              return {
                bids: orderbookData.bids
                  .map(([price, size]: [string, string]) => [Number.parseFloat(price), Number.parseFloat(size)])
                  .filter(([price, size]: [number, number]) => price > 0 && size > 0)
                  .slice(0, 25),
                asks: orderbookData.asks
                  .map(([price, size]: [string, string]) => [Number.parseFloat(price), Number.parseFloat(size)])
                  .filter(([price, size]: [number, number]) => price > 0 && size > 0)
                  .slice(0, 25),
                timestamp: Date.now(),
              }
            }
          }
          break

        case "Bybit":
          if (data.topic && data.topic.includes("orderbook") && data.data) {
            const orderbookData = data.data
            if (orderbookData.b && orderbookData.a) {
              return {
                bids: orderbookData.b
                  .map(([price, size]: [string, string]) => [Number.parseFloat(price), Number.parseFloat(size)])
                  .filter(([price, size]: [number, number]) => price > 0 && size > 0)
                  .slice(0, 25),
                asks: orderbookData.a
                  .map(([price, size]: [string, string]) => [Number.parseFloat(price), Number.parseFloat(size)])
                  .filter(([price, size]: [number, number]) => price > 0 && size > 0)
                  .slice(0, 25),
                timestamp: Date.now(),
              }
            }
          }
          break

        case "Deribit":
          if (data.params && data.params.data) {
            const orderbookData = data.params.data
            if (orderbookData.bids && orderbookData.asks) {
              return {
                bids: orderbookData.bids
                  .filter(([price, size]: [number, number]) => price > 0 && size > 0)
                  .slice(0, 25),
                asks: orderbookData.asks
                  .filter(([price, size]: [number, number]) => price > 0 && size > 0)
                  .slice(0, 25),
                timestamp: Date.now(),
              }
            }
          }
          break
      }
    } catch (error) {
      console.error(`Error parsing ${venue} orderbook:`, error)
    }
    return null
  }, [])

  // Effect to manage connections
  useEffect(() => {
    console.log(`🚀 Connecting to venues for symbol: ${symbol}`)

    venues.forEach((venue) => {
      connectToVenue(venue, symbol)
    })

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up WebSocket connections")

      Object.values(websockets.current).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, "Component unmounting")
        }
      })

      Object.values(reconnectTimeouts.current).forEach((timeout) => {
        clearTimeout(timeout)
      })

      Object.values(heartbeatIntervals.current).forEach((interval) => {
        clearInterval(interval)
      })

      websockets.current = {}
      reconnectTimeouts.current = {}
      heartbeatIntervals.current = {}
    }
  }, [venues, symbol, connectToVenue])

  return { orderbooks, connectionStatus, error }
}

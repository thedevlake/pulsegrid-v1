import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export function useWebSocket(url: string, onMessage?: (data: any) => void) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const { token } = useAuthStore.getState()
    if (!token) return

    const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://')
    const fullUrl = `${wsUrl}?token=${token}`

    const connect = () => {
      try {
        const ws = new WebSocket(fullUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket connected')
          setConnected(true)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'ping') {
              // Respond to ping
              ws.send(JSON.stringify({ type: 'pong' }))
            } else if (onMessage) {
              onMessage(data)
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
          setConnected(false)
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      } catch (error) {
        console.error('WebSocket connection error:', error)
        setConnected(false)
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [url, onMessage])

  return { connected, ws: wsRef.current }
}


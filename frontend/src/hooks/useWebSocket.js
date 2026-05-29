import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

// Singleton client instance shared across the app
let stompClient = null;
let subscriberCount = 0;
let subscribers = new Set();

const WS_URL = 'ws://localhost:8080/ws';
const RECONNECT_DELAY = 5000;

/**
 * Creates or returns the singleton STOMP client.
 */
function getOrCreateClient() {
  if (stompClient && stompClient.active) {
    return stompClient;
  }

  stompClient = new Client({
    brokerURL: WS_URL,
    reconnectDelay: RECONNECT_DELAY,
    debug: (str) => {
      // Uncomment for debugging:
      // console.log('[STOMP]', str);
    },
    onConnect: () => {
      console.log('[WebSocket] Connected to', WS_URL);

      // Subscribe to notifications topic
      stompClient.subscribe('/topic/notifications', (message) => {
        try {
          const data = JSON.parse(message.body);
          // Notify all registered callbacks
          subscribers.forEach((callback) => callback(data));
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      });
    },
    onDisconnect: () => {
      console.log('[WebSocket] Disconnected');
    },
    onStompError: (frame) => {
      console.error('[WebSocket] STOMP error:', frame.headers['message']);
      console.error('[WebSocket] Details:', frame.body);
    },
    onWebSocketClose: () => {
      console.log('[WebSocket] Connection closed. Will reconnect in', RECONNECT_DELAY / 1000, 'seconds...');
    },
  });

  return stompClient;
}

/**
 * Hook to connect to the WebSocket and receive notification updates.
 *
 * @param {function} onNotification - Callback invoked with parsed notification data
 *                                     whenever a message arrives on /topic/notifications
 */
export function useWebSocket(onNotification) {
  const callbackRef = useRef(onNotification);

  // Keep the callback ref up to date without re-subscribing
  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    // Wrap callback in a stable reference
    const handler = (data) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    // Register this subscriber
    subscribers.add(handler);
    subscriberCount++;

    // Activate client if this is the first subscriber
    const client = getOrCreateClient();
    if (!client.active) {
      client.activate();
    }

    // Cleanup on unmount
    return () => {
      subscribers.delete(handler);
      subscriberCount--;

      // Deactivate client when no more subscribers
      if (subscriberCount <= 0 && stompClient) {
        subscriberCount = 0;
        stompClient.deactivate();
        stompClient = null;
      }
    };
  }, []);
}

export default useWebSocket;

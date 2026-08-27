import { useEffect, useRef, useCallback } from 'react';

export default function useWebSocketLite(url: string | null, options: { onOpen?: () => void, onMessage?: (e: MessageEvent) => void }) {
    const wsRef = useRef<WebSocket | null>(null);
    const optionsRef = useRef(options);

    // Keep options fresh to avoid stale closures
    useEffect(() => {
        optionsRef.current = options;
    });

    useEffect(() => {
        if (!url) return;
        
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            optionsRef.current.onOpen?.();
        };

        ws.onmessage = (e) => {
            optionsRef.current.onMessage?.(e);
        };

        return () => {
            // Only close if it's not already closing/closed
            if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [url]);

    const sendJsonMessage = useCallback((msg: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    return { sendJsonMessage };
}

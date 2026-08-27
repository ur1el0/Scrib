import { useEffect, useRef, useCallback } from 'react';

export default function useWebSocketLite(url: string | null, options: { onOpen?: () => void, onMessage?: (e: MessageEvent) => void }) {
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!url) return;
        
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            options.onOpen?.();
        };

        ws.onmessage = (e) => {
            options.onMessage?.(e);
        };

        return () => {
            ws.close();
        };
    }, [url]);

    const sendJsonMessage = useCallback((msg: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    return { sendJsonMessage };
}

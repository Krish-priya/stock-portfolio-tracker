import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function useLivePrices() {
  const { socket, connected } = useSocket();
  const [prices, setPrices] = useState({});
  const [flash, setFlash] = useState({});

  useEffect(() => {
    if (!socket) return undefined;

    function onPriceUpdate(payload) {
      if (!payload?.symbol) return;
      setPrices((prev) => ({
        ...prev,
        [payload.symbol]: payload,
      }));
      setFlash((prev) => ({ ...prev, [payload.symbol]: Date.now() }));
    }

    socket.on('price:update', onPriceUpdate);
    return () => socket.off('price:update', onPriceUpdate);
  }, [socket]);

  return { prices, flash, connected };
}

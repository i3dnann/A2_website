import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createLiveSubscriber, type LiveState } from "../api/client";

type LiveStatusContextValue = {
  state: LiveState | null;
  loading: boolean;
};

const LiveStatusContext = createContext<LiveStatusContextValue | null>(null);

export function LiveStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiveState | null>(null);

  useEffect(() => {
    const subscription = createLiveSubscriber(setState);
    return subscription.stop;
  }, []);

  const value = useMemo(() => ({ state, loading: state === null }), [state]);
  return <LiveStatusContext.Provider value={value}>{children}</LiveStatusContext.Provider>;
}

export function useLiveStatus() {
  const value = useContext(LiveStatusContext);
  if (!value) throw new Error("useLiveStatus must be used within LiveStatusProvider");
  return value;
}

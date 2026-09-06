import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ConfirmOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback<ConfirmFn>((message, options) => {
    setState({ message, ...options });
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    setState(null);
    resolveRef.current(result);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state ? (
        <div className="confirm-overlay" onClick={() => settle(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">{state.message}</p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => settle(false)}>
                {state.cancelLabel ?? "Annuler"}
              </button>
              <button
                className={`btn ${state.danger ? "btn-danger-outline" : "btn-primary"}`}
                onClick={() => settle(true)}
                autoFocus
              >
                {state.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}

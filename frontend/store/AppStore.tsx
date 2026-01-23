import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { Receipt } from "../services/backend";

export type PaymentMethodKey = "manual" | "venmo" | "stripe" | "cash_app" | "apple_pay";

export type User = {
  id: string;
  name: string;
  phone?: string;
};

export type Friend = {
  id: string;
  name: string;
  phone?: string;
  color: string;
};

export type BillStatus = "pending" | "paid";

export type Bill = {
  id: string;
  receiptId: string;
  senderId: string;
  recipientId: string;
  amount: number;
  status: BillStatus;
  createdAt: string;
  preferredPaymentMethod?: PaymentMethodKey;
};

export type ReceiptRecord = {
  id: string;
  title: string;
  createdAt: string;
  payerId?: string;
  receipt: Receipt;
  participantIds: string[];
  preferredPaymentMethod?: PaymentMethodKey;
};

export type DraftSplit = {
  receipt: Receipt;
  title: string;
  participantIds: string[];
  assignments: Record<string, string[]>;
  totals: Record<string, number>;
  preferredPaymentMethod?: PaymentMethodKey;
};

export type AppState = {
  currentUser: User;
  friends: Friend[];
  receipts: ReceiptRecord[];
  bills: Bill[];
  draftSplit: DraftSplit | null;
};

type AppAction =
  | { type: "hydrate"; state: AppState }
  | { type: "setDraftReceipt"; receipt: Receipt }
  | { type: "setDraftTitle"; title: string }
  | { type: "setDraftParticipants"; participantIds: string[] }
  | { type: "setDraftAssignments"; assignments: Record<string, string[]> }
  | { type: "setDraftTotals"; totals: Record<string, number> }
  | { type: "setDraftPaymentMethod"; method: PaymentMethodKey }
  | { type: "clearDraft" }
  | { type: "addFriend"; friend: Friend }
  | { type: "addReceiptAndBills"; receipt: ReceiptRecord; bills: Bill[] }
  | { type: "markBillPaid"; billId: string };

const STORAGE_KEY = "@evenly_app_state_v2";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const FRIEND_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ef4444", "#06b6d4"];

function nextFriendColor(existing: Friend[]) {
  const used = new Set(existing.map((f) => f.color));
  const candidate = FRIEND_COLORS.find((c) => !used.has(c));
  return candidate || FRIEND_COLORS[existing.length % FRIEND_COLORS.length];
}

function defaultState(): AppState {
  return {
    currentUser: { id: "me", name: "You" },
    friends: [],
    receipts: [],
    bills: [],
    draftSplit: null
  };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "setDraftReceipt": {
      const receipt = action.receipt;
      const assignments: Record<string, string[]> = {};
      receipt.items.forEach((it) => {
        assignments[it.id] = [];
      });
      return {
        ...state,
        draftSplit: {
          receipt,
          title: "New split",
          participantIds: [state.currentUser.id],
          assignments,
          totals: {}
        }
      };
    }

    case "setDraftTitle": {
      if (!state.draftSplit) return state;
      return { ...state, draftSplit: { ...state.draftSplit, title: action.title } };
    }

    case "setDraftParticipants": {
      if (!state.draftSplit) return state;
      return { ...state, draftSplit: { ...state.draftSplit, participantIds: action.participantIds } };
    }

    case "setDraftAssignments": {
      if (!state.draftSplit) return state;
      return { ...state, draftSplit: { ...state.draftSplit, assignments: action.assignments } };
    }

    case "setDraftTotals": {
      if (!state.draftSplit) return state;
      return { ...state, draftSplit: { ...state.draftSplit, totals: action.totals } };
    }

    case "setDraftPaymentMethod": {
      if (!state.draftSplit) return state;
      return {
        ...state,
        draftSplit: { ...state.draftSplit, preferredPaymentMethod: action.method }
      };
    }

    case "clearDraft":
      return { ...state, draftSplit: null };

    case "addFriend":
      return { ...state, friends: [action.friend, ...state.friends] };

    case "addReceiptAndBills":
      return {
        ...state,
        receipts: [action.receipt, ...state.receipts],
        bills: [...action.bills, ...state.bills]
      };

    case "markBillPaid":
      return {
        ...state,
        bills: state.bills.map((b) => (b.id === action.billId ? { ...b, status: "paid" } : b))
      };

    default:
      return state;
  }
}

type AppStore = {
  state: AppState;
  actions: {
    setDraftReceipt: (receipt: Receipt) => void;
    setDraftTitle: (title: string) => void;
    setDraftParticipants: (participantIds: string[]) => void;
    setDraftAssignments: (assignments: Record<string, string[]>) => void;
    setDraftTotals: (totals: Record<string, number>) => void;
    setDraftPaymentMethod: (method: PaymentMethodKey) => void;
    clearDraft: () => void;
    addFriend: (input: { name: string; phone?: string; id?: string }) => Friend;
    addReceiptAndBills: (input: {
      receipt: Receipt;
      title: string;
      participantIds: string[];
      totals: Record<string, number>;
      preferredPaymentMethod?: PaymentMethodKey;
    }) => void;
    markBillPaid: (billId: string) => void;
  };
};

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState);
  const didHydrate = useRef(false);
  const didSeedDemo = useRef(false);
  const didNormalizeDemo = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (!raw) {
          didHydrate.current = true;
          return;
        }
        const parsed = JSON.parse(raw) as AppState;
        dispatch({ type: "hydrate", state: { ...defaultState(), ...parsed } });
        didHydrate.current = true;
      } catch {
        didHydrate.current = true;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!didHydrate.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => null);
  }, [state]);

  useEffect(() => {
    if (!didHydrate.current) return;
    if (didNormalizeDemo.current) return;

    const alexCandidates = state.friends.filter((f) => f.id === "alex" || f.name.trim().toLowerCase() === "alex");
    const hasDuplicateAlex = alexCandidates.length > 1;
    const hasAnyReceiptsOrBills = state.receipts.length > 0 || state.bills.length > 0 || !!state.draftSplit;

    if (!hasDuplicateAlex && !hasAnyReceiptsOrBills) {
      didNormalizeDemo.current = true;
      return;
    }

    const keepAlex = alexCandidates[0] || {
      id: "alex",
      name: "Alex",
      phone: "+1 555 0100",
      color: "#22c55e"
    };

    const friendsWithoutAlex = state.friends.filter((f) => !(f.id === "alex" || f.name.trim().toLowerCase() === "alex"));
    const nextState: AppState = {
      ...state,
      friends: [{ ...keepAlex, id: "alex", name: "Alex" }, ...friendsWithoutAlex],
      receipts: [],
      bills: [],
      draftSplit: null
    };

    didNormalizeDemo.current = true;
    dispatch({ type: "hydrate", state: nextState });
  }, [state]);

  useEffect(() => {
    if (!didHydrate.current) return;
    if (didSeedDemo.current) return;
    const hasAlex = state.friends.some((f) => f.id === "alex" || f.name.trim().toLowerCase() === "alex");
    if (hasAlex) {
      didSeedDemo.current = true;
      return;
    }

    dispatch({
      type: "addFriend",
      friend: {
        id: "alex",
        name: "Alex",
        phone: "+1 555 0100",
        color: "#22c55e"
      }
    });
    didSeedDemo.current = true;
  }, [state.friends.length]);

  const store = useMemo<AppStore>(() => {
    return {
      state,
      actions: {
        setDraftReceipt: (receipt) => dispatch({ type: "setDraftReceipt", receipt }),
        setDraftTitle: (title) => dispatch({ type: "setDraftTitle", title }),
        setDraftParticipants: (participantIds) => dispatch({ type: "setDraftParticipants", participantIds }),
        setDraftAssignments: (assignments) => dispatch({ type: "setDraftAssignments", assignments }),
        setDraftTotals: (totals) => dispatch({ type: "setDraftTotals", totals }),
        setDraftPaymentMethod: (method) => dispatch({ type: "setDraftPaymentMethod", method }),
        clearDraft: () => dispatch({ type: "clearDraft" }),
        addFriend: ({ name, phone, id }) => {
          const friend: Friend = {
            id: id || makeId("friend"),
            name,
            phone,
            color: nextFriendColor(state.friends)
          };
          dispatch({ type: "addFriend", friend });
          return friend;
        },
        addReceiptAndBills: ({ receipt, title, participantIds, totals, preferredPaymentMethod }) => {
          const createdAt = new Date().toISOString();
          const record: ReceiptRecord = {
            id: receipt.id,
            title,
            createdAt,
            payerId: state.currentUser.id,
            receipt,
            participantIds,
            preferredPaymentMethod
          };

          const bills: Bill[] = participantIds
            .map((pid) => {
              const amt = totals[pid];
              if (typeof amt !== "number" || !(amt > 0)) return null;
              return {
                id: makeId("bill"),
                receiptId: receipt.id,
                senderId: state.currentUser.id,
                recipientId: pid,
                amount: amt,
                status: pid === state.currentUser.id ? "paid" : "pending",
                createdAt,
                preferredPaymentMethod
              };
            })
            .filter(Boolean) as Bill[];

          dispatch({ type: "addReceiptAndBills", receipt: record, bills });
        },
        markBillPaid: (billId) => dispatch({ type: "markBillPaid", billId })
      }
    };
  }, [state]);

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}

export function getParticipantDisplay(
  state: AppState,
  participantId: string
): { name: string; color: string } {
  if (participantId === state.currentUser.id) return { name: state.currentUser.name, color: "#111827" };
  const friend = state.friends.find((f) => f.id === participantId);
  if (friend) return { name: friend.name, color: friend.color };
  return { name: "Unknown", color: "#6b7280" };
}

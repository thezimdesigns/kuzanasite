"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { removePushSubscription, savePushSubscription } from "@/app/actions/public";
import { cn } from "@/components/ui";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type Support = "unsupported" | "ios-install" | "idle" | "denied";
type State = Support | "subscribed" | "working";

const noopSubscribe = () => () => {};

export async function subscribeToPush(eventId?: string) {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID!) }));
  const visitorId = localStorage.getItem("kuzana.visitorId") ?? undefined;
  await savePushSubscription(sub.toJSON(), eventId, visitorId);
  return sub;
}

function detect(): Support {
  if (!VAPID || typeof window === "undefined") return "unsupported";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return ios && !standalone ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "idle";
}

/**
 * Opt-in for browser notifications. Visitors are only subscribed after the
 * browser's own permission prompt. On iPhone, push needs the site installed.
 */
export function PushOptIn({ eventId, compact = false }: { eventId?: string; compact?: boolean }) {
  // Browser capability is read on the client only; the server renders nothing.
  const support = useSyncExternalStore(noopSubscribe, detect, () => "unsupported" as const);
  const [status, setState] = useState<State | null>(null);
  const state: State = status ?? support;

  useEffect(() => {
    if (support !== "idle" || eventId) return;
    navigator.serviceWorker.getRegistration("/sw.js").then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      if (sub) setState("subscribed");
    });
  }, [support, eventId]);

  async function enable() {
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "idle");
      await subscribeToPush(eventId);
      setState("subscribed");
    } catch {
      setState("idle");
    }
  }

  async function disable() {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("idle");
  }

  if (state === "unsupported") return null;
  if (state === "ios-install") {
    return (
      <p className="max-w-xl rounded-[var(--radius-control)] bg-white/80 px-3 py-2 text-sm text-muted">
        <BellRing className="mr-1.5 inline size-4 text-orange-dark" />
        On iPhone, tap <strong>Share → Add to Home Screen</strong>, then open KUZANA from your home screen to turn on alerts.
      </p>
    );
  }
  if (state === "denied") {
    return <p className="text-sm text-muted">Notifications are blocked in your browser settings.</p>;
  }
  if (state === "subscribed") {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-green-900">
          <BellRing className="size-4" /> {eventId ? "You'll be notified about this event." : "Alerts are on."}
        </span>
        {!eventId && (
          <button type="button" onClick={disable} className="inline-flex items-center gap-1 text-muted underline">
            <BellOff className="size-3.5" /> Turn off
          </button>
        )}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={enable}
      disabled={state === "working"}
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-[var(--radius-control)] border border-green-900/40 bg-white font-heading font-bold text-green-900 hover:bg-green-900 hover:text-white disabled:opacity-60",
        compact ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5",
      )}
    >
      <Bell className="size-4" />
      {eventId ? "Notify me about this event" : "Turn on live alerts"}
    </button>
  );
}

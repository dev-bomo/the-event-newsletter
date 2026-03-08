/**
 * Paddle.js checkout integration.
 * Requires VITE_PADDLE_CLIENT_TOKEN and VITE_PADDLE_PRICE_ID_* in .env.
 * Script is loaded via index.html.
 */

declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: { token: string; checkout?: { settings?: object } }) => void;
      Checkout: {
        open: (opts: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email: string };
          customData?: Record<string, string>;
          settings?: { displayMode?: string; theme?: string }
        }) => void;
      };
    };
  }
}

const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
const priceIds: Record<string, string> = {
  monthly: import.meta.env.VITE_PADDLE_PRICE_ID_MONTHLY as string,
  "6mo": import.meta.env.VITE_PADDLE_PRICE_ID_6MO as string,
  yearly: import.meta.env.VITE_PADDLE_PRICE_ID_YEARLY as string,
};

let initialized = false;

function ensurePaddle(): Promise<typeof window.Paddle> {
  return new Promise((resolve, reject) => {
    if (window.Paddle) {
      if (!initialized && token) {
        try {
          window.Paddle.Initialize({
            token,
            checkout: { settings: { displayMode: "overlay", theme: "light" } },
          });
          initialized = true;
        } catch (e) {
          // already initialized
        }
      }
      resolve(window.Paddle);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (window.Paddle && token) {
        try {
          window.Paddle.Initialize({
            token,
            checkout: { settings: { displayMode: "overlay", theme: "light" } },
          });
          initialized = true;
        } catch (_) {}
      }
      resolve(window.Paddle!);
    };
    script.onerror = () => reject(new Error("Failed to load Paddle.js"));
    document.head.appendChild(script);
  });
}

export async function openPaddleCheckout(
  planId: string,
  customerEmail: string,
  userId: string
): Promise<void> {
  const priceId = priceIds[planId];
  if (!priceId) {
    console.warn("Paddle: no price ID for plan", planId);
    return;
  }
  if (!token) {
    console.warn("Paddle: VITE_PADDLE_CLIENT_TOKEN not set");
    return;
  }
  const Paddle = await ensurePaddle();
  if (!Paddle?.Checkout) {
    console.error("Paddle.Checkout not available");
    return;
  }
  Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: customerEmail ? { email: customerEmail } : undefined,
    customData: userId ? { user_id: userId } : undefined,
    settings: { displayMode: "overlay", theme: "light" },
  });
}

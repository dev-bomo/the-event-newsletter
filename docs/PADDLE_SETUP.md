# Paddle payment setup

This app uses [Paddle Billing](https://developer.paddle.com/) for subscriptions. Follow these steps to go live.

## 1. Create products and prices in Paddle

1. Log in to [Paddle Dashboard](https://vendors.paddle.com/) (or [Sandbox](https://sandbox-vendors.paddle.com/) for testing).
2. Go to **Catalog** → **Products** → **Add product**.
3. Create one product, e.g. **"The Event Newsletter subscription"**.
4. Add **three prices** to that product:
   - **Monthly**: $2.9/month (recurring, monthly).
   - **6 months**: $15 every 6 months (recurring, 6-month interval if available, or use a custom period).
   - **1 year**: $24/year (recurring, yearly).

   Note: If Paddle does not support "every 6 months" as a standard interval, use two products or a custom price. See Paddle docs for [prices](https://developer.paddle.com/build/products/create-products-prices).

5. Copy each **Price ID** (e.g. `pri_01xxxxx`). You will need them for the frontend.

## 2. Client-side token (frontend)

1. In Paddle: **Developer tools** → **Authentication**.
2. Create a **Client-side token** (for Paddle.js). Use **Sandbox** for testing and **Live** for production.
3. Copy the token (starts with `test_` or `live_`).

## 3. Webhook (backend)

1. In Paddle: **Developer tools** → **Notification destinations** → **Add destination**.
2. Set **URL** to: `https://your-api-domain.com/api/webhooks/paddle` (replace with your backend URL; must be HTTPS in production).
3. Subscribe to at least:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.activated`
   - `subscription.canceled`
   - `subscription.paused`
   - `subscription.resumed`
4. After saving, open the destination and copy the **Endpoint secret key** (for signature verification).

## 4. Environment variables

**Frontend** (e.g. `frontend/.env` or root `.env` for Vite):

```env
VITE_PADDLE_CLIENT_TOKEN=test_xxxx   # or live_xxxx
VITE_PADDLE_PRICE_ID_MONTHLY=pri_01xxxx
VITE_PADDLE_PRICE_ID_6MO=pri_01yyyy
VITE_PADDLE_PRICE_ID_YEARLY=pri_01zzzz
```

**Backend** (e.g. `backend/.env`):

```env
PADDLE_WEBHOOK_SECRET=your-endpoint-secret-key-from-step-3
```

## 5. Custom data (user link)

Checkout is opened with `customData: { user_id: userId }`. Paddle sends this back in webhook payloads as `data.custom_data.user_id`. The backend uses it to set `User.subscriptionExpiresAt` for the correct account. No extra config needed if you use the existing checkout flow.

## 6. Test in Sandbox

1. Use Sandbox dashboard and a Sandbox client-side token + Sandbox price IDs.
2. Run a test purchase; confirm the webhook is called (check backend logs and Paddle **Notification history**).
3. Confirm the user’s `subscriptionExpiresAt` is set in your database.

## 7. Go live

1. Create **Live** products/prices and a **Live** client-side token in Paddle.
2. Create a **Live** notification destination pointing to your production API URL.
3. Switch env vars to Live token, Live price IDs, and the Live webhook secret.
4. Redeploy frontend and backend.

## Troubleshooting

- **Checkout doesn’t open**: Ensure `VITE_PADDLE_CLIENT_TOKEN` and the three `VITE_PADDLE_PRICE_ID_*` are set and the token matches the environment (sandbox vs live).
- **Webhook 401**: Verify `PADDLE_WEBHOOK_SECRET` matches the endpoint secret for the notification destination. Ensure the webhook route receives the **raw** body (the app configures this for `/api/webhooks/paddle`).
- **User not updated after payment**: Check that checkout was opened with `customData: { user_id: "<your-user-id>" }` and that the webhook payload includes `data.custom_data.user_id`. Check backend logs for “Paddle: set subscriptionExpiresAt”.

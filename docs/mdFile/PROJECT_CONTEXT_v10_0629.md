# PanTrKa Project Handoff v10 - 2026-06-29

## Current Environment

- Branch: `main`
- Public test server: `https://pantrka.com`
- Deployment: Docker Compose + Caddy + Cloudflare Tunnel
- Server runbook: `docs/TEST_SERVER.md`
- Production checklist: `docs/PRODUCTION_READINESS.md`
- Secrets remain in ignored `.env.server`; never copy them into tracked files.

## Latest Public Deployment

The current working tree was deployed to the public server on 2026-06-29.

Verified after deployment:

- `https://pantrka.com/health` returned HTTP 200.
- Frontend production build completed successfully.
- NICEPAY payment service unit tests completed successfully.
- Payment database schema contains the new virtual-account and receipt columns.
- The deployed order bundle contains `cardAndEasyPay`, `bank`, and `vbank` payment methods.

## NICEPAY Payment Update

Implemented payment choices on the order page:

- Credit card + easy payment: NICEPAY `cardAndEasyPay`
- Bank transfer: NICEPAY `bank`
- Virtual account: NICEPAY `vbank`

Virtual-account behavior:

- Account issuance is stored as payment status `READY` while the order remains `PENDING`.
- Bank name, account number, holder, and expiration are stored and shown on the payment result and order-detail pages.
- A signed NICEPAY webhook verifies signature, order number, and amount before changing the payment and order to paid.
- Cancelling a pending virtual-account order also cancels the NICEPAY payment.

Cash receipt behavior:

- NICEPAY's cash-payment flow handles the receipt request.
- `issuedCashReceipt` and receipt URL results are stored with the payment.
- Receipt status/link is shown in order details when available.

NICEPAY operating configuration:

- Frontend and backend now use the same production NICEPAY client key through `NICEPAY_CLIENT_KEY` in Compose.
- The secret key is backend-only.
- Webhook endpoint: `https://pantrka.com/api/payments/nice/webhook`
- NICEPAY production webhooks registered successfully for `card`, `bank`, and `vbank`.
- Registration and lookup returned NICEPAY result code `0000`; all three methods point to the endpoint above.

Cloudflare requirement:

- Keep the active NICEPAY custom Skip rule for source IPs `121.133.126.86` and `121.133.126.87`.
- The rule must skip Browser Integrity Check and the selected WAF/rate-limit/bot components.
- Removing this rule causes NICEPAY webhook URL validation to fail with `U337`.

Important: NICEPAY is configured with production credentials. No real-money payment was executed automatically during development.

## OAuth And Mobile Fixes

- OAuth callback URLs use the canonical HTTPS application base URL instead of the current browser origin.
- HTTP requests to `pantrka.com` are redirected to HTTPS by Caddy.
- OAuth state generation supports mobile in-app browsers without `crypto.randomUUID`.
- Kakao, Naver, and Google use HTTPS callbacks.
- Google OAuth works in Safari/Chrome, but Google policy can reject embedded in-app browsers with `disallowed_useragent`.
- Social login returns users to the intended page and merges the guest cart after login.

## Product And Checkout Fixes

- BAGS and other category navigation uses a full navigation so SSR product data is not replaced by a failed in-app-browser refetch.
- BAGS public API and SSR output were verified with four products at the time of the fix.
- Checkout preserves selected cart items and a pending order for payment retry.
- NICEPAY user cancellation code `P091` is treated as a normal dialog close and no longer displays a red error.
- Guest Buy Now redirects through login, merges the guest cart, and resumes checkout.

## Legal And Company Information

- Terms effective date: 2026-06-29.
- Terms and privacy pages contain the current company, representatives, registration number, address, and email.
- Public company-information blocks omit telephone numbers.
- Privacy officer section contains both co-representatives and their requested contact details.
- Footer representatives are `구소연, 황지민`.

## Other Included Frontend Work

- Mobile home-banner controls and swipe behavior.
- Product-detail mobile ordering and spacing updates.
- Guest cart quantity/delete controls.
- Mobile navigation and header updates.
- Search/product query consistency and cache invalidation updates.
- Signup, user profile, and admin user fields expanded by the current working tree.
- Existing details are also recorded in `docs/mdFile/PROJECT_frontend_v6_0628.md`.

## Verification Evidence

Successful commands used during this work:

```powershell
cd frontend
npm run build

cd ..\backend
.\gradlew test --tests com.pantrka.backend.domain.order.service.PaymentServiceTest --no-daemon

docker compose --env-file .env.server -f compose.test-server.yml up -d --build backend frontend
```

Known local test limitation:

- The full backend test command compiled successfully, but 9 database integration tests failed because the local PostgreSQL instance was not running. The isolated payment service tests passed.

## Required Next Checks

Do not describe payment readiness as complete until these are performed with controlled production transactions and database checks:

1. Complete one low-value card/easy-payment transaction and verify payment, order, inventory, coupon, and cancellation state.
2. Complete one bank-transfer transaction and verify cash-receipt result storage.
3. Issue and fund one virtual account, then verify the NICEPAY webhook changes payment `READY -> DONE` and order `PENDING -> PAID` exactly once.
4. Cancel/refund each supported method and verify NICEPAY, database, inventory, sales count, and coupon state together.
5. Review all unchecked P0 items in `docs/PRODUCTION_READINESS.md` before launch.

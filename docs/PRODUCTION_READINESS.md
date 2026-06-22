# Production Readiness

Last audited: 2026-06-21

This is the persistent handoff for future Codex sessions. Check the code again before changing an item's status because the repository may have moved since the audit.

## P0 - Launch Blockers

- [ ] **Verify NICE Payments cancellation/refund for paid-order cancellation in the sandbox.**
  Paid-order cancellation now calls the NICE Payments full-cancel API before restoring local stock/coupon state. Verify the NICE transaction, database, inventory, coupon, and retry behavior together with a real sandbox payment.
  Evidence: `PaymentService.cancelPaidOrder` and `OrderService.cancelOrder`.

- [ ] **Verify NICE Payments refund processing for returns and persist refund audit data.**
  Approved return completion now calls the NICE Payments full-cancel API before changing the order to `REFUNDED`. Persist cancellation identifiers, gateway response, and failure/retry state, then verify the sandbox flow.
  Evidence: `PaymentService.cancelPaidOrder` and `ReturnExchangeService.completeRequest`.

- [ ] **Correct exchange inventory processing.**
  Exchange completion restores all old option stock but does not decrement the desired option stock. The request is order-level rather than item-level, so partial returns/exchanges are not modeled safely.
  Evidence: `ReturnExchangeService.completeRequest` and `ReturnExchangeRequest`.

- [ ] **Expire abandoned PENDING orders and restore reservations.**
  Order creation immediately decrements stock and deletes cart items. There is no scheduled expiry/reconciliation process, so an abandoned payment can reserve stock forever. Add an expiry timestamp, safe worker, retry handling, and tests.
  Evidence: `backend/src/main/java/com/pantrka/backend/domain/order/service/OrderService.java` around `createOrder`.
  Client mitigation: checkout now persists the generated PENDING order and selected-item snapshot in session storage, reuses that order for payment-window-close retries, and verifies it is still PENDING before reopening payment. Server-side expiry and reservation restoration remain required.

- [ ] **Make NICE payment confirmation fully reconcilable.**
  NICE server approval validates the callback signature and amount and locks the order. Local processing failure triggers a compensating cancel attempt. Still add a unique order/payment database constraint, NICE webhook or scheduled transaction inquiry, persisted retry state, and timeout recovery.
  Evidence: `PaymentService.confirmNicePayment`.

- [ ] **Prevent coupon double reservation/use.**
  Coupons are only marked used after payment, allowing the same member coupon to be attached to concurrent PENDING orders. Model reservation/expiry and lock the coupon during transitions.

- [ ] **Rotate every exposed production-capable credential.**
  At minimum rotate the Google OAuth client secret disclosed in chat. Audit AWS, SMTP, NICE Payments, JWT, DB, and Redis credentials and move production values to a secret manager. Do not record secret values here.

## P1 - Required Before Launch

- [x] Replace hard-coded frontend `http://localhost:8080` URLs with validated environment configuration, including refresh requests.
  Evidence: `frontend/src/lib/api.ts` uses the validated `NEXT_PUBLIC_API_BASE_URL` for normal and refresh requests and requires it in production. With `NEXT_PUBLIC_API_BASE_URL=https://api.shop.example.com`, `npm run build` and `npx eslint src/lib/api.ts` passed on 2026-06-20.
- [x] Make backend CORS origins environment-specific and restrict them to the production domains.
  Evidence: `SecurityConfig` reads exact HTTP(S) origins from `APP_CORS_ALLOWED_ORIGINS`, rejecting wildcards, credentials, paths, queries, and fragments. The test deployment sets only `https://pantrka.com` and `https://www.pantrka.com`; `./gradlew test` passed, including `SecurityConfigTest`, on 2026-06-20.
- [ ] Add a production Spring profile. Disable `ddl-auto: update`, `show-sql`, debug logging, and public Swagger; introduce Flyway or Liquibase migrations.
- [ ] Enforce legal order-state transitions. Admin code currently permits arbitrary transitions and does not couple refund states to gateway results.
  Evidence: `backend/src/main/java/com/pantrka/backend/domain/admin/service/AdminOrderService.java`.
- [x] Fix shipping validation so both carrier and tracking number are required for `SHIPPED`.
  Evidence: `AdminOrderService` rejects either missing value and trims both before persistence. Admins can view and correct shipping information for shipped/delivered orders through the dedicated shipping endpoint, and customers can view it in order history and details. `./gradlew test`, targeted frontend ESLint, and `npm run build` passed on 2026-06-20.
- [ ] Add rate limits and attempt limits for login, signup, OAuth, password-reset send, and six-digit code verification. Avoid account-enumerating responses.
- [ ] Revoke existing refresh sessions after password reset, account withdrawal, password change, or security-sensitive role changes.
- [ ] Move refresh authentication to `HttpOnly`, `Secure`, appropriately scoped cookies, or document and mitigate the accepted localStorage/XSS risk.
  Evidence: `frontend/src/stores/authStore.ts`.
- [ ] Validate uploads server-side using allowed extensions, decoded file type/signature, size, and trusted S3 key handling. Do not trust client MIME type.
  Evidence: `backend/src/main/java/com/pantrka/backend/infra/s3/S3Service.java`.
- [ ] Replace the superficial health endpoint with readiness/liveness checks for required dependencies, without leaking sensitive details.
- [ ] Create production deployment assets and runbooks: app containers/hosting, HTTPS/domain, DB/Redis backup and restore, migrations, rollback, log retention, monitoring, alerts, and incident contacts.
  Test-server progress: Docker images, private PostgreSQL/Redis networking, Caddy gateway, Cloudflare Tunnel HTTPS, a manual backup procedure, and `docs/TEST_SERVER.md` are implemented and verified at `https://pantrka.com`. Production migrations, automated off-device backups, rollback, monitoring, alerts, and incident ownership remain.
- [ ] Replace all legal placeholders in terms/privacy pages: representative, business registration, ecommerce registration/address/contact, processor/shipping vendors, privacy officer, and effective date. Obtain appropriate legal review.
- [ ] Configure Google OAuth production redirect URIs and consent-screen publishing after rotating the secret.
- [ ] Configure NICE Payments production keys, API domain, callback URL, outbound IP policy, and webhook after sandbox verification.

## P2 - Quality and Completeness

- [ ] Implement or remove the customer-facing "option change is preparing" action in `frontend/src/app/mypage/orders/page.tsx`.
- [ ] Add frontend tests. The audit found zero frontend test files; prioritize checkout, payment success/failure, auth refresh, cancellation, and admin status actions.
- [ ] Resolve the existing full-project ESLint failures. The 2026-06-20 audit observed 44 errors and 54 warnings, although the production build succeeded.
- [ ] Expand backend integration tests for real state transitions: payment retry/concurrency, PENDING expiry, refunds, partial returns, exchanges, coupons, password reset limits, OAuth, and authorization.
- [ ] Add `robots.txt`, sitemap, canonical/metadata, production analytics/consent configuration, and transactional email deliverability checks.

## Verification Baseline

Verified on 2026-06-20:

- `frontend`: `npm run build` passed and generated 45 routes.
- `backend`: `./gradlew test` passed.
- Frontend tests: none found.
- Full frontend ESLint: failed with 44 errors and 54 warnings; changed OAuth/signup files passed targeted lint during their implementation.

Passing builds and mocked/unit tests do not clear the P0 items. Before launch, complete a NICE Payments sandbox end-to-end matrix covering success, duplicate callback, timeout, browser close, cancellation, refund, return, exchange, and reconciliation after simulated DB failure.

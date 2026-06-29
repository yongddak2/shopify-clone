# Frontend Update Log v6 - 2026-06-28

## Scope

This note summarizes the mobile UX, cart, checkout redirect, and deployment updates applied to the PanTrKa frontend on 2026-06-28.

## Home Banner

- Mobile-only banner cleanup:
  - Hidden left/right arrows on phone width.
  - Hidden `shop now` on phone width.
  - Hidden `Find Your Style` title on phone width.
  - Moved and reduced slide indicator dots on phone width.
- Added mobile swipe support:
  - Swipe left moves to the next banner.
  - Swipe right moves to the previous banner.
  - Vertical scrolling is preserved by requiring a horizontal swipe threshold.
  - A swipe does not trigger the banner link click.

Files:
- `frontend/src/app/HomeContent.tsx`

## Product Detail Mobile Order

- Changed mobile product detail ordering to:
  - Gallery images
  - Product info / quantity / purchase buttons / Delivery / Returns
  - Product detail images
  - Reviews
- Desktop layout remains unchanged.
- Reduced the spacing between `Delivery / Returns` and the following divider/detail section on mobile.

Files:
- `frontend/src/app/products/[id]/ProductDetailClient.tsx`

## Guest Cart Panel

- Added guest cart item controls inside the cart drawer:
  - Quantity decrement/increment buttons.
  - Pink `삭제` button.
  - Delete button moved to the same line as the item price.
  - Delete text is bold and underlined.
- Guest cart updates are persisted through localStorage and the cart query is refreshed immediately.

Files:
- `frontend/src/components/cart/CartPanel.tsx`

## Guest Cart Merge After Login

- Guest cart items now merge into the member cart immediately after login.
- Cart query invalidation now returns the invalidation Promise, allowing login flows to wait for cart refresh.
- Applied to:
  - Email/password login.
  - Social login callback.

Files:
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/oauth/callback/[provider]/page.tsx`
- `frontend/src/lib/queryInvalidator.ts`

## Guest Buy Now Redirect

- Fixed guest `바로 구매하기` from product detail:
  - Saves selected option to guest cart.
  - Stores pending buy-now intent in sessionStorage.
  - Sends user to `/login?redirect=/order`.
  - After login/social login, merges guest cart, finds the matching server cart item, starts checkout, then redirects to `/order`.
- Signup preserves the redirect and returns the user to login with the same redirect after signup.

Files:
- `frontend/src/app/products/[id]/ProductDetailClient.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/signup/page.tsx`
- `frontend/src/app/oauth/callback/[provider]/page.tsx`
- `frontend/src/lib/checkoutSession.ts`
- `frontend/src/lib/oauth.ts`

## Mobile Menu

- Mobile `SHOP` now expands subcategories:
  - `ALL`
  - `BAGS`
  - `TOPS`
  - `BOTTOMS`
  - `ACCS`
- Mobile `PNTK` now uses the same `pntk-seasons` data as the desktop dropdown.
- Open top-level mobile category is shown in white.
- Subcategory text is smaller than top-level text.
- Expand/collapse animation added.
- Mobile menu spacing adjusted to match the target visual reference.

Files:
- `frontend/src/components/layout/Header.tsx`

## Deployment

Frontend was deployed repeatedly through the test-server compose stack after each change:

```powershell
docker compose --env-file .env.server -f compose.test-server.yml up -d --build --no-deps frontend
```

Final verification:

- Frontend production build: passed.
- `pantrka-test-frontend-1`: restarted successfully.
- `https://pantrka.com`: HTTP 200 confirmed.

## Known Notes

- File-level lint still reports pre-existing `react-hooks/set-state-in-effect` errors in some components, especially `Header.tsx`, `ProductDetailClient.tsx`, and the OAuth callback page.
- Production Next build succeeds despite those lint rule failures.
- Existing Next `<img>` optimization warnings remain in several frontend files.

# Booking, pickup and delivery setup

Every existing business demo now has booking.html, reachable from its homepage and the rep desk's business materials. Service businesses offer appointment enquiries. Suitable retail/food businesses offer pickup and delivery enquiries. A preferred date is a request, never an available slot or a confirmed booking. Regulated or uncertain storefronts use general contact enquiries rather than an unverified ordering flow.

## Two customer paths

- **Direct request:** a visitor prepares their name, callback number, preferred date/time and question. They review the request, copy it or open a text draft, and contact the business. Nothing is submitted to a shared database, charged, reserved or dispatched by this form. The business must confirm. Business phones may not accept texts, so the call option remains available.
- **Connected provider:** verified public booking or ordering pages open on the provider, where actual availability, checkout, payments and confirmation are handled. Existing connections include Booksy, Goldie, Uber Eats, DoorDash and OrderSave for matched business profiles. Availability and delivery areas remain the provider's responsibility.

## Owner onboarding

Open reps/connections.html and choose the correct business. The page shows published links and any verification issue. Add the owner's public store/calendar URL, the provider and a note explaining the matching name/address. Confirm owner approval, save a local draft and export it for administrator review. Drafts do not change customer pages. Never paste private keys, passwords or customer data into this setup.

Supported public-link templates include Uber Eats, DoorDash, Grubhub, Toast, OrderSave, Square, Booksy, Goldie, Calendly, Fresha, OpenTable and Resy. Adding a URL connects a customer destination; it does not establish account-level API access, calendar synchronization or courier dispatch.

For publication, recheck the exported link and the merchant location, update automation/leads/booking/providers.json with the approved verified connection, run node automation/leads/booking/install.mjs, and use the public-hosting deployment instructions. Keep unavailable, mismatched or unverified profiles out of customer pages.

## Full account integrations

Live calendars, deposits, checkout and delivery dispatch need each merchant's authorized account, actual service/menu data, availability, fulfillment settings and any provider approval. A Supabase app connection requested reauthentication; an alternate CLI login exists, but no campaign-owned database was identified and existing unrelated projects were not modified. A new shared booking backend is not represented as active. Connect the chosen merchant accounts and confirm a campaign backend before enabling those account-level features.

The customer request form keeps details in the page until the visitor deliberately shares them. It does not save customer details in local storage or in publicly readable files. Owner setup drafts stay in the manager's browser until exported.

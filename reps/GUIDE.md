# Give every worker one route

1. Open `/reps/` and choose **Set up the five routes**. The initial 125 businesses follow the existing five geographic routes. Replace Rep 1–5 with your workers' names.
2. Each business has one assignment. Change its worker in the assignment list if needed. Export the assignment file as your master copy.
3. Select **Get worker link** and send that link to the matching worker. The link contains that worker's current business list in stop order. It is a snapshot: when you reassign a business, send fresh links to both workers and tell them to stop using the old links. Keep one manager responsible for the master assignment file.
4. On the worker's device, open their link before leaving. Their screen shows their name, the current stop, the business name and street address. They must verify both before the matching presentation unlocks. **Next business** moves through their list one at a time and resets verification.
5. After verification, choose **Present to owner** for a clean screen with the business name, address, website and proposal. This hides assignments, pitch prompts and private visit notes. **Back to rep view** restores the worker controls; moving to another business resets verification. Show desktop and mobile using the two preview buttons. Both load the actual site in a live frame at 1280px or 390px. Open full website for an unrestricted view. Confirm the phone and directions links on an actual phone.
6. Use the three conversation prompts. Ask the owner which customer question matters most; show that exact service, photo, directions or product feature. Let them try it. Ask what needs changing and agree on the next conversation. The proposal is specific to the same business; choosing a plan is not an order or a payment.
7. Record the visit result, notes and follow-up date, then move to the next business. Notes are local to that browser, not synced. Export at the end of the day; import the file on another device's same rep route if needed. Do not use notes to store payment or other sensitive personal information.

## Before the team leaves

The local server at `127.0.0.1:4178` only works on the computer running it. It is not a public website. For workers on separate devices, host the complete campaign `out/` folder on a reachable HTTPS website and generate worker links from that address. The hub does not publish itself. A shared same-network server is another option if separately configured; it will not remain reachable when workers leave that network.

Download each original-route ZIP from the manager cards before leaving if available. Those packs contain the initial route assignments, not later browser edits. Check the business list against your exported current assignments. Keep the extracted folder intact; use its local server instructions for reliable preview behavior. For reassigned routes, regenerate the pack or use the hosted personal link. Preview every planned demo on the actual device before the trip; a successfully loaded page does not mean the entire campaign is available offline.

## Owner-facing truth

- These are proposed websites, not an assertion that the business hired you.
- Owners must approve service wording, hours, prices, photographs and rights before launch.
- Catalogues currently contain clearly marked sample items. Actual products, quantities and prices must come from the owner. Manual stock publishing is available with the campaign server; there is no point-of-sale synchronization or checkout.
- Enquiry tools help customers prepare a request. Do not describe them as confirmed bookings or claim messages are delivered if they are only copied locally.
- Discuss the actual written scope, hosting, domain, maintenance and ownership terms in the proposal. Do not promise search rankings, sales increases or an exclusive competitive advantage.

## Limits

Rep links filter the interface; they are not login credentials or access controls. Business previews are public campaign material. Assignment files, link snapshots and visit exports do not synchronize. To prevent duplicate visits, use one current master assignment file and replace stale links promptly. Cross-device dispatch, shared notes and authenticated accounts would require a deployed shared backend.

## Share to a worker phone

Enter the worker’s phone number on their manager card. US numbers may use10digits; other countries need the country code. **Send route by text** or **Send with WhatsApp** prepares a message addressed to that worker. Review it and press Send in the selected app. The route link opens their ordered businesses, websites, proposals and pitch scripts. Phone numbers stay in the manager browser and assignment export; they are not included in personal route URLs.

Each stop shows Website, Proposal and Pitch script together before verification and immediately above the visit record. These links always match the current business. Verify the storefront before presenting to the owner.

## New prospects and merchant services

The manager desk links to the NYC/NJ smoke-shop research queue and owner booking/delivery setup. New prospects are not completed demos or assigned stops. Each existing business has Booking & order options beside its website/proposal/script links. Direct forms prepare requests; only the business or a connected provider can confirm them. See BOOKING-GUIDE.md for onboarding and account-level integration limits.

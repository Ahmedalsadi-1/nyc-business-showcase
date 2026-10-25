# Store collections and inventory

The 27 retail, food and tire demos have a **Browse collection** page. Customers can search products, filter collections and availability, sort prices, and open item details. These are manually maintained catalogues; they do not connect to a cash register, take payments, or reserve stock.

## What to show an owner

Open the business's `inventory.html` page. Search for an item and open its detail panel. Explain: “Customers could see what you carry before they visit. You control the products, prices and availability.” The starting items and prices are labelled examples. They are not verified stock. Concept illustrations and generated still lifes are not photographs of the shop's products.

Ask the owner for their actual product list, prices, stock policy, and photographs they have permission to use. Confirm whether they want exact quantities or simply availability. Keep “Confirm availability” when the information is unknown.

## Edit a catalogue

1. Start the campaign server from the repository root:

   ```sh
   node automation/leads/serve_campaign.mjs
   ```

2. Open the correct business at `http://127.0.0.1:4178/sites/BUSINESS-SLUG/inventory.html?edit=1`. Verify its name before changing anything.
3. Add or edit products, collection names, prices, quantities and descriptions. Choose an illustration or supply an HTTPS photo URL. A local photograph already in that site's `photos/` folder also works.
4. Leave the sample-item flag on demonstration products. Remove it only after the owner confirms the item and its details.
5. Save your edits. Drafts stay in that browser on that device. They are not public yet. Export JSON to keep a backup or transfer the draft to another device; import it into the matching store editor there.

## Publish and verify

Click **Publish**, then enter the publishing key for that store. The server creates individual store keys in `automation/leads/work/private/catalogue-keys.json`. Only the campaign administrator should access that private file. Give a store only its own key; do not include keys in ZIP packages, public links, or source control.

A successful publish writes the store's `inventory.json`. Open its collection page without `?edit=1` in a fresh browser tab or device and verify the public result. Public pages read the published catalogue and ignore unpublished editor drafts. An incorrect key or invalid product data leaves the draft available to fix or export.

The editor supports up to 500 items and catalogue uploads up to 2 MB. Export a JSON backup before a major import or replacement.

## Devices, hosting and handoff

`127.0.0.1` works only on the computer running the server. A phone or rep's laptop needs a separately hosted copy or its own local package/server. This repository's server listens on localhost; it is not a public hosting deployment.

The ZIP handoff includes the published inventory file and its editor. A static host can display the catalogue and support local drafts/JSON export. **The Publish button requires the catalogue API**, a protected store key, and hosting configured for that backend. For a static-only launch, the administrator can replace the site's `inventory.json` with the confirmed exported file and redeploy it.

Refresh packages after publishing if you want their ZIP files to contain the latest inventory. Stock does not update automatically when something sells. Agree with the owner who maintains it and how often, or scope a separate POS integration before promising live stock.

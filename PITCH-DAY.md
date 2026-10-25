# In-person website pitches

Start at the [rep presentation desk](reps/index.html). The [full gallery](sites/index.html) is useful for browsing; the rep desk is the working visit list so each person shows the correct business.

Run `node automation/leads/serve_campaign.mjs` from the repository root, then open `http://127.0.0.1:4178/reps/` on that computer.

## Set up the team

1. The manager chooses **Set up the five routes** and reviews the assignments in the rep desk and gives every business one assigned rep. Replace placeholder rep names with the actual workers' names.
2. Choose **Get worker link** for each worker and give them that personal link. Export the assignment file as the manager’s master copy. Confirm that they can open it on the device they will carry.
3. Workers open their personal link and work through one business at a time. Check the business name and street address against the storefront before opening its presentation.
4. Record the outcome, follow-up date and notes after each visit, then choose **Next business**. Use **Export visits** at the end of the shift and return it to the manager.

The manager cards also link the five original-route ZIP packs. These reflect the saved original assignments, not later browser edits. Each extracted pack includes `START.html`, a personal route, and `start.mjs`; follow its README for local presentation. Rebuild packs after changing the saved assignment file.

Assignment links are snapshots, and browser progress is local to the device. This is not a shared live CRM or login system. Reissue assignment links after changing ownership; collect exports rather than assuming another device sees the latest notes. A rep link is for the worker, not the business owner.

## Show the owner a useful customer journey

Ask permission for a short demonstration: “We put together a website concept for your business. Can I show you how a customer would find what they need?”

1. Verify the displayed name and address. Open **mobile** view first: most of the walkthrough should work comfortably on the phone a customer carries. Switch to **desktop** to show the full composition.
2. Start with a concrete question: “What do customers call you about most often?” Show the relevant service, enquiry planner, collection or inventory page. Let the owner try the interaction.
3. Show the shop's photographs and review excerpts, then Visit or Contact. Demonstrate where a customer finds hours, calls, and directions. Verify those facts with the owner.
4. For a store, search and open an item. Explain that the starting catalogue is a sample and ask what they would want to display. See the [inventory guide](INVENTORY-GUIDE.md).
5. Ask what they would change, then open that business's matching proposal. Discuss its actual plan and scope. Plan selection highlights a choice; it does not submit an order or take payment.
6. Close with a specific next step: permission to follow up, the best contact method and time, and which package they want quoted. Record their answers in the visit notes.

Use demonstrable benefits: clearer service information, a more useful first impression, easier calls and directions, and a browsable product range. Do not promise more sales, search rankings, live booking, payments, or POS stock unless that capability is included and connected. Customer enquiries in the demos may prepare text for copying or calling; they are not automatically delivered bookings.

## Prepare the actual pitch devices

- Localhost links work only on the computer running the server. To use the same links on workers' phones, deploy the campaign to a reachable host first. The local server is not a public deployment.
- Test every assigned demo and its mobile/desktop switch before leaving. Keep the correct packages available as a fallback.
- Each business has a folder and ZIP in `packages/`. Keep its files together. Open `proposal.html` or `site/index.html`.
- External fonts, Google Maps, remote product photos and Google review links need internet. Local pages and bundled photographs can be shown from the package.
- Confirm business details, photo permissions, review excerpts, product data and the agreed scope before publication. Catalogue publishing requires the backend described in the inventory guide.
- The original Python generator predates the individually edited websites. Running it again would overwrite their designs.

## Validation and package refresh

From the repository root:

```sh
node automation/leads/qa_multipage.mjs
node automation/leads/refresh_packages.mjs
```

The first command checks HTML and desktop/mobile layouts. The second refreshes packages and ZIP archives from the edited sites; it does not generate websites. Refresh packages after approved site or inventory changes.

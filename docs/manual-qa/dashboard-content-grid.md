# Dashboard Content Grid QA

The steps below verify each user-facing action in the dashboard content grid after wiring the Supabase operations.

## Prerequisites
- A Supabase project with the latest schema and storage buckets (`uploads`).
- Seed data that includes at least one brand rider, one CV, and one upload belonging to your test user.
- The test user is authenticated in the local app session.

## Single-item actions
1. Open `/dashboard` and hover a card to reveal quick actions.
2. **Duplicate** a brand or CV and confirm a new entry appears after refreshing the grid.
3. **Delete** the duplicated record, confirming the confirmation dialog and that the entry disappears.
4. **Share** a brand or CV and ensure the clipboard contains the generated share URL.
5. **Download** each content type:
   - Brand/CV should trigger a PDF download.
   - Uploads should download the original file from Supabase storage.
6. For brands, use **Generate CV** to confirm navigation to the CV generation flow.

## Bulk actions
1. Select multiple items and open **Bulk Actions**.
2. Run **Duplicate** and verify new copies appear for every selected item.
3. Use **Export All** to trigger downloads for every selected item.
4. Use **Share All** and ensure the clipboard receives newline-delimited share URLs.
5. Toggle visibility with **Make Public/Private** and confirm the `visibility` badge updates after refresh.
6. Use **Archive** and verify the items move out of the main filter when you exclude archived entries.
7. Choose **Add Tag**, enter a new tag, and confirm it appears on each selected item in the Tag Manager tab.
8. Run **Delete** and confirm all selected entries are removed.

## Tag and favorite management
1. Open the **Tags** tab (brands/CVs only).
2. Add and remove tags from an item, verifying that the Tag Manager updates immediately and persists after refresh.
3. Toggle the favorite star and confirm the item appears in (or disappears from) the **Favorites** tab.

## Upload-specific actions
1. Duplicate an upload and confirm both the database row and storage object are created.
2. Delete the duplicated upload and ensure the storage object is removed.

Repeat the steps above for both brands and CVs to confirm parity between content types.

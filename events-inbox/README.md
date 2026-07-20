# Events Inbox

Staging area for batches of curated local events on their way into Firebase.

A batch is a **JSON array** of event objects matching [`../EVENTS_SCHEMA.md`](../EVENTS_SCHEMA.md):

```json
[
  {
    "title": "Carolina Renaissance Festival",
    "dateText": "Oct 4 – Nov 23, weekends only",
    "startDate": "2026-10-04",
    "endDate": "2026-11-23",
    "where": "Huntersville, ~25 min",
    "cost": "$28 adult / $14 kids 5-12",
    "ticketNote": "Buy online in advance — cheaper than gate, Saturdays sell out",
    "blurb": "Outdoor festival with jousting, artisan booths, and food stalls.",
    "why": "Full-day outdoor event that works for both kids' ages. Lots of walking, no fixed schedule to keep.",
    "url": "https://example.com/event",
    "tags": ["outdoor", "festival", "full-day", "all-ages"]
  }
]
```

Working files are named `_tmp-*.json` and are gitignored — they're scratch, not a record. The database is the source of truth once imported.

When the family explicitly asks for research to be committed before Firebase import, name the validated file `pending-YYYY-MM-DD-*.json` and track it. Remove that pending file in a later commit only after the import is confirmed; Firebase then becomes the source of truth.

## Usage

```powershell
cd scripts\events
node import-events.js ..\..\events-inbox\_tmp-batch.json --dry-run
node import-events.js ..\..\events-inbox\_tmp-batch.json
```

Full workflow: [`../scripts/events/README.md`](../scripts/events/README.md).

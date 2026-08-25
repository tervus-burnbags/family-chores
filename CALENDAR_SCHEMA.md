# Calendar Conventions

How family events get onto the **Calendar** section of the Home tab.

Unlike chores, lists, and events, calendar entries are **not stored in Firebase**. The app reads them from Google Calendar through an Apps Script bridge. Nothing here requires a code change or a deploy — adding an event to the right Google Calendar with the right title is the entire job.

If you are an assistant picking this up: this file is the complete contract. You do not need to read `index.html` or re-derive any of it.

---

## The pipeline

```
Google Primary Calendar
        |
        v
  Apps Script web app        <- config/calendarUrl, NOT in this repo
        |  returns {events:[{title,start,end,members,allDay}]}
        v
  index.html:8329            <- fetches with ?days=N, caches 15 min
        |
        v
  Home tab Calendar section  <- colored dot per member
```

**Source calendar: `travis.browning@gmail.com` (Primary).**

The Google account also has calendars named "Family" and "Activity Calendar". **Neither is read.** Writing there is the most likely way to add an event that silently never appears.

---

## Names decide everything

The Apps Script derives the `members` array from names anywhere in the event — **the description is scanned as well as the title.** This has two consequences:

**1. A recognized name is what gets an event included at all.** An event with no recognized name is dropped from the feed entirely — it is not shown untagged. This filtering is the curation mechanism; it is why the family calendar can hold work meetings and dentist appointments without them leaking into the app.

**2. The name drives the colored dot.**

| Title contains | `members` | Dot |
|---|---|---|
| `Alex` | `["alex"]` | Alex's color |
| `Louisa` | `["louisa"]` | Louisa's color |
| `Jamie` *or* `Jameson` | `["jameson"]` | green |
| `Alex` and `Louisa` | `["alex","louisa"]` | blended both-kids |
| no recognized name | — | **event does not appear** |

Both dog spellings already work. No script change is needed to support "Jamie".

### The description is scanned too

This is the easy one to get wrong. An event titled `Alex - Soccer practice` whose description says "Louisa practices the same evening" comes back tagged `["alex","louisa"]` and renders the both-kids dot. Verified 2026-08-24.

So do not name the other child in a cross-reference. Write "her sister" instead:

```
BAD   Louisa practices the same evening on field McA-7, 5:30-6:15pm.
GOOD  Her sister practices the same evening on field McA-7, 5:30-6:15pm.
```

The same trap applies to a description that quotes a school notice mentioning both kids, or pastes in a registration blurb.

### Title format

```
<Name> - <What it is>
Alex - Picture Day
Alex and Louisa - NO SCHOOL (Labor Day)
Jamie - Vet appointment
```

Lead with the name. Keep the rest short — this list is meant to be scanned, not read.

Put detail (running order, RSVP rules, what to bring) in the **description**, not the title.

---

## What belongs on it

The calendar is a **parent action list**, not a full family schedule. It holds things the two parents need to *do*, *decide*, or *talk to the kids about*. The family expects a short list and expects most of what a school sends to not be on it.

Add:

- Days with no school or early release — childcare consequences
- Anything changing what a kid wears or brings (picture day, dress down day, field trip)
- Evening or weekend events parents attend
- Appointments, deadlines, forms due

Skip:

- Routine in-school activities the kid attends without parent involvement — weekly Mass, assemblies, in-class parties
- Purely informational notices
- Optional daytime parent meetings the family does not attend (FSA meetings are excluded by standing request)

When in doubt, skip it and say so. A missed item is one line in chat; a cluttered calendar defeats the feature.

### Check before adding

Read the existing calendar for the target dates first and **skip anything already there**, whatever it is titled. Parents add things independently — a no-school day may already be on as a work-calendar block from a spouse, under a title that looks nothing like what the school called it.

A duplicate row is worse than an imperfect one. If an existing entry is tagged to only one kid but covers both, leave it alone rather than adding a second, better-tagged copy.

### Both kids, one school

Alex and Louisa attend the same school, so most school-wide items (no-school days, picture day, dress down, flag ceremonies, back-to-school night) belong to **both**. Title those `Alex and Louisa - ...` rather than creating two events.

---

## Gotchas

- **~30-day horizon.** The Apps Script caps its window regardless of the `days` parameter — `days=60` returns the same set as `days=30`. Events further out are created fine but will not appear until they come into range. Do not treat a missing far-future event as a failure.
- **15-minute cache.** A new event will not show in the app immediately.
- **Settings day-window.** `config/calendarDays` (default 10) further limits what the Home tab shows, and its dropdown maxes out below the script's own cap.
- **Plain "No School" entries.** Some events titled just "No School" (Teams invites from Christina's work account) come back tagged `louisa` despite having no name in the title. There is a rule in the Apps Script beyond plain name matching that is not visible from outside. Do not assume the table above is exhaustive when debugging an unexpected tag.
- **You cannot reschedule an event someone else organizes.** Several recurring family events are Teams invites organized from Christina's work account, with the family as guests. Google accepts a title change on the local copy but **silently drops a time change and still returns HTTP 200 with the old time** — it does not error. Always re-read the event or the feed after changing a time; never assume the write landed. The only real fix is for the organizer to edit the series, or to replace it with an event this account owns.
- **Declining does not remove an event from the feed.** The Apps Script returns events regardless of RSVP status, so a declined invite still shows in the app. To take something off the calendar you must **delete** your copy, not decline it. Declining and then adding a replacement produces two rows, not one.
- **`update_event` cannot change a recurrence rule.** There is no `recurrenceData` field on the update call. Extending or shortening a series means deleting it and creating it again with the new `RRULE`.
- **The Apps Script is not in this repo.** It lives in the Google Apps Script editor. It cannot be read or edited from a coding session — any change to matching rules has to be made by hand in Google's editor.

---

## Verifying

Fetch the endpoint directly rather than opening the app — faster, and it shows the tagging:

```bash
curl -sL "$CALENDAR_URL?days=30" | python -c "import json,sys; [print('%-56s %s' % (e['title'], '+'.join(e['members']))) for e in json.load(sys.stdin)['events']]"
```

Confirm each new event appears **and** carries the expected members. An event missing from this output is almost always a title with no recognized name.

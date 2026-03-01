Solo Mode Architecture — Final Specification

Typing Race Application (Next.js Backend + Postgres + Redis)


---

1. Objectives

Solo mode must:

Be server-authoritative for time and final metrics

Avoid per-keystroke server validation

Allow frontend to manage live UX (blocking, highlighting, live WPM)

Keep computation minimal and deterministic


No FastAPI.
Next.js backend (Route Handlers / API routes) is sufficient.


---

2. High-Level Flow

User clicks "Initiate Race"
        ↓
Server creates raceId
        ↓
Server selects random text from Postgres
        ↓
Server stores race metadata in Redis (no startTime yet)
        ↓
Client renders text
        ↓
First character insertion → client calls Start Race
        ↓
Server stores startTime in Redis
        ↓
User types (frontend enforces correction model)
        ↓
On completion → client calls Finish Race
        ↓
Server calculates duration, WPM, accuracy
        ↓
Persist results in Postgres
        ↓
Delete Redis race state


---

3. Data Storage Design

3.1 Postgres (Persistent)

texts table

id
content
length

races table

id
user_id (nullable for guest)
text_id
duration_ms
wpm
accuracy
created_at


---

3.2 Redis (Ephemeral Race State)

Key:

race:{raceId}

Value:

{
  "textId": "...",
  "expectedLength": 342,
  "startTime": null
}

Important:

startTime does NOT exist until first keystroke.

No keystroke storage.

No incremental validation.


Redis is used because:

Race state must survive page refresh.

It avoids premature DB writes.

It allows fast atomic updates.



---

4. API Endpoints


---

4.1 Initiate Race

POST /api/race/initiate

Server Actions:

1. Select random text from Postgres


2. Generate raceId (UUID)


3. Store in Redis:



{
  "textId": "...",
  "expectedLength": text.length
}

4. Return:



{
  "raceId": "...",
  "text": "..."
}

No start time yet.


---

4.2 Start Race

POST /api/race/start

Triggered on first character insertion.

Client sends:

{
  "raceId": "..."
}

Server:

Fetch race from Redis

If startTime does not exist → set:


startTime = Date.now()

That’s it.

No conditions about null needed if the field does not exist initially.


---

4.3 Finish Race

POST /api/race/finish

Client sends:

{
  "raceId": "...",
  "totalCharactersInserted": 108
}

Definition:

totalCharactersInserted = number of printable characters inserted

Excludes backspace

Excludes arrow keys, ctrl keys, etc.



---

5. Server-Side Calculations

Server retrieves from Redis:

expectedLength
startTime

Server sets:

endTime = Date.now()
durationMs = endTime - startTime


---

5.1 Accuracy Calculation

Your chosen model:

accuracy = expectedLength / totalCharactersInserted

If:

expectedLength = 100

totalCharactersInserted = 101


Then:

accuracy = 100 / 101 ≈ 99.01%

Meaning: Extra insertions represent corrected mistakes.

Important:

If totalCharactersInserted < expectedLength → reject (invalid).


---

5.2 WPM Calculation

Standard formula:

minutes = durationMs / 60000
wpm = (expectedLength / 5) / minutes

Why divide by 5?

Industry standard: 1 word = 5 characters (including spaces).


---

6. Frontend Responsibilities

Frontend controls:

Highlighting errors

Blocking progression until correction

Live WPM display

Counting totalCharactersInserted


Frontend does NOT:

Send keystrokes per character

Control official time

Compute final stored WPM

Compute final stored accuracy


Live WPM is UX-only.


---

7. Refresh / Reconnect Handling

If user refreshes:

1. Client checks localStorage for raceId


2. Calls:



GET /api/race/{raceId}

Server returns:

text

whether startTime exists


If startTime exists:

Resume race

Client calculates elapsed = now - startTime


If not:

Race hasn't started yet



---

8. Validation Rules (Server)

Reject race if:

raceId not found

startTime missing

duration <= 0

totalCharactersInserted < expectedLength

duration unrealistic (e.g., < 300ms for 500 chars)


Optional: Add upper duration limit to prevent stale races.


---

9. Why This Architecture Is Correct

No per-keystroke network traffic

Server authoritative on time

Deterministic accuracy metric

Minimal Redis usage

Simple state model

Scales horizontally


This is clean production architecture.


---

10. What You Are Not Doing (Intentionally)

You are NOT:

Preventing client-side metric tampering

Re-validating typed text on server

Storing raw keystrokes


That is acceptable for solo mode.

Competitive mode requires stricter validation.


---

Final Model Summary

Server authoritative for:

time

final WPM

final accuracy


Client authoritative for:

character insertion counting

visual correctness enforcement

live feedback


Minimal. Deterministic. Efficient.
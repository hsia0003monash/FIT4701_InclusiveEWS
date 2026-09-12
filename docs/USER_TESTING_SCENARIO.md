# User Testing Scenario — InclusiveEWS Prototype

This scenario walks a participant through the InclusiveEWS prototype so that, by the end
of the session, they have interacted with **every feature covered by Part B of the
Survey Questions**: Accessibility, Time-Critical Usage, Situational / Context
Inclusivity, Social Design, and Other. Run the tasks in order, then have the participant
complete the Part B section of the Google Form.

> Google Form:
> https://docs.google.com/forms/d/e/1FAIpQLSdYjA6Q_-kR73voPU-rL25JG4qWhe4VYmmspAwh2iSgKYhasw/viewform

> The tasks are written against the current prototype (tabs: **Home, Map, Family,
> Plans, Settings**). Where a capability being probed by a survey question is not yet
> built (e.g. sharing to non-users, in-app language switching), the task asks the
> participant to *attempt* it and note what they find — this is deliberate and gives
> useful signal for those questions.

---

## Persona (who the participant is playing)

**Amid**, 72 years old, recently migrated to Melbourne from India. Speaks Hindi as a
first language with limited English. Uses a basic smartphone and is not very confident
with apps. Lives in an apartment with his elderly parents; has a young grandchild
(Kai, 8) and family spread across the city.

Ask the participant to behave the way Amid would: read slowly, prefer visuals and audio
over long text, and use the phone **one-handed** where they can. Use a think-aloud
protocol — the observer records what the participant says.

---

## Setup

1. Launch the app in Expo Go (or a simulator). It opens on the **Home** tab.
2. The prototype ships with three active alerts already in the system:
   - 🌊 **Flash flooding along the Yarra River** — Advice — 1.2 km away (featured on Home)
   - 🌩️ **Severe thunderstorm from the west** — Watch — 4.6 km away
   - 🔥 **Bushfire near the Dandenong Ranges** — Emergency — 32 km away
3. The bottom tab bar has five tabs: Home, Map, Family, Plans, Settings.
4. **Facilitator control:** a small round red **⚡ button** floats above the tab bar
   (bottom-right). Tapping it opens a "Simulate a threat" picker. Choosing a threat
   pushes a **full-screen, unavoidable alert** to the user (the phone vibrates). This is
   how you mock "a threat just happened" during the session. It is for the facilitator
   only — do not point it out to the participant.

---

## Scenario narrative

> It is a hot, windy afternoon. Amid is at home with his parents. His phone shows a
> weather alert. He does not have his reading glasses on, the room is noisy, and he is
> holding a cup of tea in one hand. He wants to understand what is happening, know what
> to do, make sure his family is safe, and let a neighbour know — quickly.

---

## Tasks

Each task lists the **Part B questions** it exercises. Codes: A = Accessibility,
T = Time-Critical, S = Situational/Context, D = Social Design, O = Other.

### Task 0 — A threat arrives (facilitator-triggered)
*Covers: A8, A11, A12, T1, S2 (vibration), A4 (large actions)*

1. While the participant is looking at the Home screen, the **facilitator taps the ⚡
   button** and picks the **Bushfire (Emergency)** threat.
2. A full-screen alert takes over the phone and it vibrates. Ask the participant to say,
   within **5 seconds**, what is happening and how serious it is. (T1, A8, A12)
3. Ask whether the big hazard icon + colour made it instantly clear **without reading
   much**. (A11, visual-first)
4. Have them read the numbered "What to do now" steps, then tap the large **"I'm Safe"**
   button (or "See on map"). Were the buttons easy to hit? (A4)

> Repeat with the Flood (Advice) or Storm (Watch) threat if you want to compare how
> clearly severity is communicated across levels.

### Task 1 — First reaction to the standing alert (Home)
*Covers: A1, A2, A3, A6, A7, A8, A11, A12, T1*

1. Look at the Home screen. **Without scrolling**, say out loud what the featured alert
   is and how serious it is. (A8, A11, A12)
2. Read the alert headline ("Flash flooding expected along the Yarra River"). Is the text
   easy to read, and is the wording plain? (A1, A6)
3. Is the meaning still clear if you ignore the colour of the ADVICE badge? (A2)
4. Do the icons (information badge, ⏱ "Updated 2 min ago") mean what you expect? (A7)
5. Try to grasp the main message within **5 seconds**. (T1)
6. Comment on whether the top-to-bottom order (location → alert → family) feels logical.
   (A3)

### Task 2 — Understand WHERE and WHAT TO DO (Home → Map)
*Covers: A9, A10, A13, T4*

1. On Home, tap **"Read details"** on the alert. Note whether it becomes clear **what
   actions** to take (and note if the button does nothing yet). (A10)
2. Go to the **Map** tab. Find where the danger is **relative to your home**. (A9)
3. Tap a coloured danger marker (or an alert card below the map) to open its detail. Read
   the instructions listed there. (A10)
4. From the map's markers, circles and colours, can you read the situation from the
   **visual cues** without memorising a legend? (A13)
5. Note the **mix of text, map and icons** used to convey the same information. (T4)

### Task 3 — Take a critical action fast, one-handed (Map → Family)
*Covers: T2, T3, S1, S4, D4*

1. Holding the phone in **one hand, thumb only**, scroll to and tap the large **"I'm
   Safe"** button at the bottom of the Map screen. Was it reachable and easy to hit? (S1)
2. Confirm it completed in a **single tap** (it vibrates and shows "Sent!") with no deep
   navigation. (T2, T3)
3. Go to the **Family** tab. Check who is safe and who is "Waiting". (S4, D4)
4. Tap a family member (e.g. **Kai**) to expand the quick actions (Call / Nudge / "I know
   they're safe"). Confirm you can verify a person's status here. (D4)

### Task 4 — Listen instead of read; noisy or muted (Home)
*Covers: S2, A5*

1. Back on **Home**, tap **"Read aloud"** on the alert. Note whether audio plays (and if
   not, note the gap). (S2)
2. Imagine you are in a **loud environment** — are the on-screen visual cues enough on
   their own? Then imagine your **volume is muted** — can you still get the full message
   from the screen alone? (S2)
3. Confirm that any animations or transitions do **not** hide or delay the information you
   need. (A5)

### Task 5 — Follow an emergency plan for dependents (Plans)
*Covers: D1, D3, T3*

1. Go to the **Plans** tab. Open a plan tile (e.g. the flood or fire plan) — it opens a
   detail view with steps.
2. Read the steps. Do they give helpful guidance for **dependents** — children, elderly
   parents? (D3)
3. Do the alert/plan make clear how the event could **affect your family or the
   community**? (D1)
4. Confirm you can reach the key steps without passing through many screens. (T3)

### Task 6 — Share the alert with a neighbour who has no app
*Covers: D2*

1. Try to **share** the current alert with someone who does **not** have this app (look for
   a share control on the alert detail, Home, or Map).
2. If you find one, share it (system share sheet / message). If you cannot find one, note
   that sharing to non-users is not yet possible. (D2)

### Task 7 — Set up your profile & accessibility (Settings)
*Covers: O1, A1, S3, and language attempt*

1. Go to the **Settings** tab ("Make it yours").
2. Toggle **Dark mode** and confirm the whole app changes appearance instantly. (S3, O1)
3. Toggle **Large text** and **High contrast**. Comment on whether these would help you
   read in **bright sunlight** and in **low light**, and note whether the change is visible
   yet. (A1, S3)
4. Try to **change the app language to Hindi**. If there is no language option, note that
   it is missing. (language — supports A6/Amid persona)
5. Reflect on whether it was easy to set up the app to match your preferences. (O1)

### Task 8 — Interruption, resume & typing check
*Covers: T5, A14, S4*

1. Leave the app (go to the phone's home screen) for a few seconds, then reopen it.
2. Confirm you return to **where you left off** without getting lost. (T5)
3. Note whether the layout stayed **predictable** across screens, with no sudden
   confusing changes. (A14)
4. Reflect on whether, anywhere in the whole flow, you had to do **precise typing** or tap
   **tiny buttons**. (S4)

---

## Part B coverage checklist

Tick each item once the participant has genuinely experienced (or attempted) it.

**Accessibility**
- [ ] A1  Text readability — Task 1, 7
- [ ] A2  Clarity without relying on colour — Task 1
- [ ] A3  Logical labels / reading order — Task 1
- [ ] A4  Large touch targets — Task 3 ("I'm Safe" and tab bar)
- [ ] A5  Animations/transitions don't hide info — Task 4
- [ ] A6  Plain, straightforward wording — Task 1
- [ ] A7  Familiar icons/symbols — Task 1, 2
- [ ] A8  Alert: instantly clear WHAT is happening — Task 1
- [ ] A9  Alert: instantly clear WHERE — Task 2 (Map)
- [ ] A10 Alert: instantly clear WHAT ACTION — Task 2 (details/instructions)
- [ ] A11 Critical info visible without scrolling — Task 1
- [ ] A12 Urgent alerts catch attention over minor detail — Task 1
- [ ] A13 Understand status from visual cues, no memorising — Task 2
- [ ] A14 Predictable layout, no confusing changes — Task 8

**Time-Critical Usage**
- [ ] T1  Understand main message within 5 seconds — Task 1
- [ ] T2  Critical action in a single tap — Task 3
- [ ] T3  Vital actions without multi-screen navigation — Task 3, 5
- [ ] T4  Helpful mix of text, maps, icons — Task 2
- [ ] T5  Easy to resume after interruption — Task 8

**Situational / Context Inclusivity**
- [ ] S1  One-handed / thumb reachable — Task 3
- [ ] S2  Balances sound and visual cues (loud / muted) — Task 4
- [ ] S3  Readable in sunlight and low light — Task 7
- [ ] S4  Minimizes precise typing / tiny buttons — Task 3, 8

**Social Design**
- [ ] D1  Communicates impact on family / community — Task 5
- [ ] D2  Share alerts with non-users — Task 6
- [ ] D3  Guidance for dependents (children/elderly) — Task 5
- [ ] D4  Easy to check/verify family safety status — Task 3

**Other**
- [ ] O1  Easy to set up profile & accessibility preferences — Task 7

---

## Observer notes

| Task | Time to complete | Errors / hesitations | Verbatim quotes |
|------|------------------|----------------------|-----------------|
| 0    |                  |                      |                 |
| 1    |                  |                      |                 |
| 2    |                  |                      |                 |
| 3    |                  |                      |                 |
| 4    |                  |                      |                 |
| 5    |                  |                      |                 |
| 6    |                  |                      |                 |
| 7    |                  |                      |                 |
| 8    |                  |                      |                 |

After the tasks, ask the participant to complete **Part B** of the Google Form.

---

## Known gaps to watch for (facilitator reference)

These are prototype limitations relevant to Part B, based on the current build. Do not
read these to the participant — use them to interpret responses:

- **"Read details" / "Read aloud"** on the Home alert are not wired to an action yet
  (relevant to A10, S2).
- **Sharing to non-app users** has no dedicated control yet (D2).
- **Language switching (e.g. Hindi)** is not available in Settings on this build; the
  accessibility toggles other than Dark mode are visual-only for now (relevant to A1, S3,
  O1, and the Amid persona).

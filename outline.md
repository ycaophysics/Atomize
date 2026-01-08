# Atomize Plan Outline (Refined Intake + Goblin-style Breakdown + Fluid Scheduling)

Atomize is a Gemini-powered task secretary: users maintain a **living task list** (with importance/urgency labels), Atomize generates **Goblin.tools-like subtasks (https://goblin.tools/ToDo)**, then continuously produces **conflict-free, fluid plans** aligned with the user’s real calendar and behavior—without forcing rigid schedules.

---

## 1. Product goal and scope

### 1.1 One-sentence goal
Convert a user’s full task inventory into **actionable subtasks** and a **dynamic “Now” recommendation** that adapts smoothly as tasks and schedules change.

### 1.2 Target users
- People with many concurrent responsibilities who struggle to decide “what next”
- Users who prefer flexibility (P-type tendencies) and/or have ADHD-like patterns:
  - time blindness, overwhelm, avoidance, inconsistent follow-through
- Busy experts (research, startup, personal admin, relationships) needing a “secretary” that keeps plans up to date

### 1.3 What Atomize is not
- Not therapy, not diagnosis.  
- Support is limited to practical encouragement and self-regulation suggestions (breaks, reframing, environment tweaks).

---

## 2. Core principles (design constraints)

1. **Task list is explicit and persistent**  
   The user maintains a canonical list of current tasks, not a one-off “brain dump.”

2. **User labels drive priority**  
   Users can mark tasks as:
   - Important / Not important
   - Urgent / Not urgent  
   Atomize can suggest labels only when missing, but user choice wins.

3. **Goblin-style decomposition**
   Every task can be expanded into subtasks in a predictable, user-friendly format:
   - clear steps
   - small durations
   - “tiny first step” always available

4. **Fluid plans (windows + soft constraints)**
   Scheduling uses flexible windows and reschedules smoothly when new tasks appear or calendar conflicts happen.

5. **Low friction + high momentum**
   The product must reliably end each interaction with **one next action** that can be started immediately.

---

## 3. Intake redefinition: “Current Task Inventory”

### 3.1 What the user provides (structured intake)
Instead of pasting messy text, the user **lists all current tasks** in a simple task-entry UI:

Example tasks:
- “Write academic paper” — **Important**, **Not urgent**
- “Clean apartment” — **Not important**, **Not urgent**
- “Car annual inspection” — **Important**, **Unsure** 
- “Startup” — (user may label later; defaults allowed)
- “Dating” — (same)
- “Gemini hackathon” — (same)

### 3.2 Required vs optional fields
**Required**
- Task title (short)
- Importance label (I / not-I / Unsure) OR “unknown”
- Urgency label (U / not-U/ Unsure) OR “unknown”

**Optional (strongly recommended over time)**
- Deadline date/time (if any)
- Recurrence (weekly, monthly)
- Domain/context (Work / Personal / Admin / Health / Relationships / Startup)
- Energy type (deep work / light admin / social / errands)
- Location/tool constraints (needs laptop, needs car, needs phone calls)
- Estimated total effort (rough)
- “Hardness” / dread level (0–3)

### 3.3 Fast entry UX (critical for ADHD/P-type)
- **Quick Add**: one line per task, labels via tap chips (Important / Urgent)
- **Inbox mode**: user can add tasks without labeling; Atomize later proposes labels
- **Batch labeling**: swipe or multi-select to mark multiple tasks at once
- **Default label**: if unknown, Atomize treats as “Important? = uncertain” and asks later only if it blocks planning

---

## 4. Task intelligence: Goblin.tools-like breakdown

### 4.1 Decomposition output (user-facing)
For each task, Atomize generates subtasks in a clear checklist format similar to Goblin.tools ToDo:
- Steps are concrete, sequential, and phrased as actions
- Each step has:
  - estimated minutes
  - a “tiny first step” (≤ 2 minutes)
  - optional dependency (must-do-before)

Example: “Car annual inspection” (Important, Unsure)
1. Find required documents (10 min)  
   - tiny first step: “Open glovebox and pull registration”
2. Check inspection locations & hours (8 min)  
   - tiny first step: “Search ‘inspection near me’”
3. Schedule a time / choose walk-in plan (7 min)
4. Go to inspection (45–90 min; includes travel)
5. Save receipt + update records (5 min)

### 4.2 Decomposition controls (user adjustable)
- **Breakdown depth slider**: “Light / Standard / Detailed”
- **Step-size preference**: default 10–25 min chunks; allow 5–10 min for high-avoidance
- **Style presets**:
  - “Executive mode” (fewer steps)
  - “ADHD mode” (more micro-steps + stronger tiny-first-step emphasis)
- **User edits are first-class**: user can merge/split/rename steps and the planner adapts

### 4.3 Priority usage during breakdown
Importance/Urgency labels influence:
- how many subtasks are generated
- how much detail is produced
- which constraints are requested (deadlines, location)  
Example: Important+Urgent tasks get earlier clarifying prompts and more scheduling effort.

---

## 5. Scheduling: Fluid plans that shift smoothly without conflict

### 5.1 Scheduling philosophy
- Use **time windows** and **soft blocks** by default.
- Convert to hard calendar events only when needed or when user opts in.

### 5.2 Calendar integration behavior (core expectations)
- Atomize reads Google Calendar to detect:
  - busy blocks
  - free windows
  - recurring commitments
- Atomize proposes a daily/weekly plan consisting of:
  - a small number of flexible work blocks
  - task-step assignments to those blocks
- When user adds a new task, the plan updates **incrementally**:
  - no “wipe and rewrite” unless user requests

### 5.3 Conflict-free shifting model (important detail)
Represent the schedule as blocks with constraints:

**Block types**
- **Hard blocks**: meetings, appointments, fixed deadlines (non-movable)
- **Soft blocks**: Atomize task work blocks (movable within a window)
- **Pinned blocks**: user-locked tasks (“do not move this”)

**Constraints**
- Avoid overlapping blocks
- Respect “do not schedule” times (sleep, class, commute)
- Keep daily total planned time within a user tolerance
- Match energy type to time-of-day (optional)
- Keep context switching low (batch similar tasks)

### 5.4 Plan update when new tasks are added
When a new task arrives, Atomize performs a “local repair”:
1. Insert the task’s next subtask into the recommendation queue based on I/U
2. If it needs calendar time:
   - find the earliest compatible soft window
   - shift lower-priority soft blocks later (within allowed windows)
   - if no room exists, propose:
     - shorten blocks, split tasks, or move low-importance tasks to “later”
3. Present the change in a readable diff:
   - “Moved Clean apartment block from Sat 2pm to Sun 11am”
   - “Added Hackathon prep block Fri 4–5pm”

### 5.5 Minimal surprise rule
- Never silently move a pinned block.
- Never move more than N blocks in one change without asking.
- Always explain the top reason for a move (deadline proximity / urgent insertion).

---

## 6. Execution: Now Card + alternates

### 6.1 Now Card contents
- One recommended next subtask:
  - title, est minutes, tiny first step
  - reason: importance/urgency + schedule fit
- Two alternates:
  - one “easier win” (momentum task)
  - one “strategic” (important but not urgent)

### 6.2 One-tap outcomes
- **Start** → status=started, optional timer
- **Finished** → status=finished, auto-recommend next
- **Not finished** → triggers replan (shrink/split/method switch)
- **Snooze** → postpone with bounded options (15/30/60 min)

---

## 7. Replan logic (misses, overruns, avoidance)

### 7.1 If “Not finished”
Atomize picks one primary adjustment:
1. **Shrink**: create a 10-minute “version” of the subtask
2. **Split**: break into smaller steps
3. **Switch method**: template-driven approach (outline first, ask for example, gather inputs)
4. **Reschedule**: move to a better window (energy/time fit)

Then update:
- Now Card recommendation
- soft blocks on calendar (if enabled)

### 7.2 If user ignores reminders or doesn’t check the box
A missed response triggers:
- one hypothesis (timing bad / too big / notification fatigue / competing demand)
- one lightweight question maximum  
Example: “Was the timing bad, or was the step too big?”

Then adapt the strategy:
- reduce reminders
- change tone
- propose a smaller step
- move the task to a better window

---

## 8. Breaks + supportive language (non-therapy)

### 8.1 When to suggest breaks
- multiple misses in a row
- dense day schedule
- user signals frustration/overwhelm

### 8.2 What to suggest (practical)
- 2–5 minute reset options: water, stretch, walk, breathe, tidy
- “reduce scope” suggestions: “Do 10 minutes only”
- optional meditation suggestion, always framed as a choice

### 8.3 Guardrails
- No clinical claims, no diagnosis language.
- If user expresses serious distress, provide safety-oriented guidance and stop productivity pushing.

---

## 9. Personalization (learn what works)

### 9.1 What we learn (privacy-preserving)
- best responsive times
- preferred step size
- which nudge styles work
- common “why it failed” patterns

### 9.2 How we use it
- tune recommendation selection
- tune scheduling window choices
- tune reminder frequency and tone
- auto-suggest task labeling when user leaves labels unknown

---

## 10. Stage plan (implementation roadmap)

### Stage 0 — Local MVP (no calendar)
- Task list with importance/urgency
- Goblin-style breakdown into subtasks
- Now Card with status updates
- Simple replan (shrink/split)

### Stage 1 — Your “first stage” (calendar + fluid shifting)
- Google Calendar read/write
- soft vs hard blocks
- incremental rescheduling when tasks are added
- end-of-block checkbox enforcement
- missed reminder reasoning + strategy adaptation
- break suggestions + supportive messages (bounded)
- personalization v0

### Stage 2 — Richer inputs (optional)
- voice, email ingestion, attachments
- domain templates (research, admin, relationships, startup)

---

## 11. Definition of done (Stage 1)
Stage 1 is done when:
1. User can maintain a task inventory with importance/urgency labels.
2. Atomize generates Goblin-style subtasks reliably and edits persist.
3. Atomize creates a conflict-free, fluid plan against Google Calendar.
4. User can add tasks anytime; the plan shifts smoothly without chaos.
5. Start/end prompts require a simple completion response.
6. Missed responses trigger a minimal check-in and adaptive replanning.
7. Break suggestions/supportive text appears when appropriate, without becoming therapy.
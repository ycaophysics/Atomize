# Requirements Document

## Introduction

Atomize is a Gemini-powered anti-procrastination assistant designed for busy professionals who struggle with task overwhelm. The system acts as a "personal secretary" that captures messy inputs, breaks them into actionable micro-tasks, prioritizes intelligently, and adapts plans fluidly when things change. The core philosophy is "simple to use, complex inside" – users interact through natural conversation while sophisticated AI handles the heavy lifting.

## Glossary

- **Task**: A unit of work to be completed by the user
- **Micro_Task**: A small, actionable step (15-60 minutes) broken down from a larger task
- **Atomization_Engine**: The AI component that breaks vague tasks into concrete micro-tasks
- **Task_Inbox**: The entry point where users dump unstructured thoughts, goals, or tasks
- **Plan_View**: The organized display of prioritized tasks for today and upcoming days
- **Priority_Level**: Classification of task importance (High, Medium, Low)
- **Minimum_Viable_Progress**: The smallest deliverable that represents meaningful progress on a task
- **Clarification_Loop**: The conversational exchange where the assistant asks questions to refine vague inputs
- **Adaptation**: The automatic rescheduling and reprioritization when circumstances change

## Requirements

### Requirement 1: Task Intake via Conversational Inbox

**User Story:** As a busy professional, I want to dump my messy thoughts and tasks into a simple input, so that I don't have to spend time organizing them myself.

#### Acceptance Criteria

1. WHEN a user enters unstructured text (brain dump, email paste, vague goal) THEN THE Task_Inbox SHALL accept and parse the input without requiring specific formatting
2. WHEN the input contains multiple potential tasks THEN THE Atomization_Engine SHALL identify and extract each distinct task
3. WHEN the input is ambiguous or missing critical details THEN THE Clarification_Loop SHALL ask focused questions to gather necessary information
4. THE Clarification_Loop SHALL ask no more than 3 questions per task to minimize user burden
5. WHEN clarification is complete THEN THE System SHALL confirm the understood task with the user before proceeding
6. IF the user provides a deadline in natural language (e.g., "by Friday", "next week") THEN THE System SHALL parse and store the deadline correctly

### Requirement 2: Intelligent Task Atomization

**User Story:** As someone who procrastinates on large tasks, I want my big tasks automatically broken into small actionable steps, so that I always know exactly what to do next.

#### Acceptance Criteria

1. WHEN a task is estimated to take longer than 60 minutes THEN THE Atomization_Engine SHALL break it into micro-tasks of 15-60 minutes each
2. THE Atomization_Engine SHALL phrase each micro-task as a concrete action starting with a verb (e.g., "Draft introduction paragraph", "Email John for data")
3. WHEN breaking down a task THEN THE Atomization_Engine SHALL identify dependencies between micro-tasks and order them appropriately
4. WHEN micro-tasks have no dependencies THEN THE Atomization_Engine SHALL mark them as parallelizable
5. THE Atomization_Engine SHALL provide a time estimate for each micro-task
6. FOR ALL tasks with deadlines THEN THE Atomization_Engine SHALL suggest a Minimum_Viable_Progress fallback option
7. THE Atomization_Engine SHALL stop decomposing when tasks are actionable without further clarification (typically 15-60 minute chunks)
8. WHEN displaying the breakdown THEN THE System SHALL show tasks in a clear hierarchical structure with parent-child relationships

### Requirement 3: Priority Classification

**User Story:** As an overwhelmed professional, I want my tasks automatically prioritized, so that I always know what to focus on first without decision fatigue.

#### Acceptance Criteria

1. THE System SHALL classify each task with a Priority_Level (High, Medium, Low)
2. WHEN a task has a deadline within 24 hours THEN THE System SHALL automatically mark it as High priority
3. WHEN a task has a deadline within 7 days THEN THE System SHALL mark it as at least Medium priority
4. THE System SHALL allow users to manually override any priority assignment
5. WHEN displaying tasks THEN THE Plan_View SHALL order tasks by priority and deadline
6. THE System SHALL provide a brief explanation for why a task was assigned its priority (e.g., "High: due tomorrow")

### Requirement 4: Adaptive Plan Management

**User Story:** As someone whose plans constantly change, I want my task plan to automatically adapt when things shift, so that I never have to manually reorganize everything.

#### Acceptance Criteria

1. WHEN a user marks a task as complete THEN THE System SHALL update the plan and suggest the next task
2. WHEN a user defers a task THEN THE System SHALL automatically reschedule it and adjust other tasks accordingly
3. WHEN a new high-priority task is added THEN THE System SHALL reorder the plan to accommodate it
4. WHEN a deadline changes THEN THE System SHALL recalculate priorities and reorder tasks
5. THE System SHALL never guilt-trip or shame the user for changing plans or missing tasks
6. WHEN rescheduling occurs THEN THE System SHALL briefly explain what changed and why

### Requirement 5: Conversational Interaction

**User Story:** As a user, I want to interact with my task assistant through natural conversation, so that managing tasks feels effortless like talking to a helpful colleague.

#### Acceptance Criteria

1. THE System SHALL accept natural language commands for common actions (e.g., "move this to tomorrow", "mark done", "break this down more")
2. WHEN the user asks a question about their tasks THEN THE System SHALL respond conversationally with relevant information
3. THE System SHALL use friendly, supportive language that reduces anxiety rather than increasing it
4. WHEN a task is completed THEN THE System SHALL provide positive acknowledgment (e.g., "Nice work!", "One down!")
5. THE System SHALL support quick actions via buttons/shortcuts for common operations (Done, Defer, Break Down More)

### Requirement 6: Simple Task Views

**User Story:** As a busy professional, I want to see only what I need to focus on right now, so that I'm not overwhelmed by my entire task list.

#### Acceptance Criteria

1. THE Plan_View SHALL display a "Today" section showing only tasks scheduled for the current day
2. THE Plan_View SHALL display an "Upcoming" section for tasks in the next 7 days
3. THE Plan_View SHALL display a "Later" section for tasks beyond 7 days (collapsed by default)
4. WHEN displaying the Today section THEN THE System SHALL show no more than 5-7 tasks to prevent overwhelm
5. THE System SHALL provide a clear visual distinction between High, Medium, and Low priority tasks
6. THE System SHALL show progress indicators (e.g., "3 of 5 tasks done today")

### Requirement 7: Gentle Reminders and Check-ins

**User Story:** As someone who loses track of time, I want gentle reminders about my tasks, so that I stay on track without feeling nagged.

#### Acceptance Criteria

1. WHEN a scheduled task time arrives THEN THE System SHALL send a friendly reminder notification
2. THE System SHALL allow users to configure reminder frequency (Off, Minimal, Normal, Frequent)
3. WHEN a user hasn't interacted for an extended period during work hours THEN THE System SHALL send a gentle check-in
4. THE System SHALL use supportive language in reminders (e.g., "Ready to start?" not "You're behind!")
5. WHEN a user snoozes a reminder THEN THE System SHALL respect the snooze without judgment
6. IF a task is repeatedly snoozed THEN THE System SHALL offer to break it into smaller steps or reschedule it

### Requirement 8: Progress Celebration

**User Story:** As someone who needs motivation, I want to feel good about completing tasks, so that I stay motivated to keep going.

#### Acceptance Criteria

1. WHEN a task is marked complete THEN THE System SHALL display a brief positive acknowledgment
2. WHEN all tasks for the day are complete THEN THE System SHALL display a celebratory message
3. THE System SHALL track and display a "streak" of consecutive days with completed tasks
4. IF a streak is broken THEN THE System SHALL not shame the user but offer encouragement to start fresh
5. THE System SHALL show daily/weekly progress summaries highlighting accomplishments
6. THE System SHALL use varied celebration messages to avoid repetitiveness

### Requirement 9: Data Persistence

**User Story:** As a user, I want my tasks and progress saved reliably online, so that I never lose my work and can access it from anywhere.

#### Acceptance Criteria

1. THE System SHALL persist all tasks, priorities, and completion status to online storage
2. IF the user does not explicitly request a change THEN THE System SHALL only append new data, never modify or delete existing data
3. WHEN the user explicitly requests a modification THEN THE System SHALL make the minimum necessary change to the specific task
4. THE System SHALL NOT delete any task data unless the user explicitly requests deletion
5. THE System SHALL NOT batch-modify multiple tasks unless the user explicitly requests it
6. WHEN the application is reopened THEN THE System SHALL restore the user's complete task state from online storage
7. THE System SHALL save changes immediately after any user action
8. THE System SHALL support exporting task data in a standard format (JSON)
9. WHEN a task is "completed" or "archived" THEN THE System SHALL mark it as such but retain the data

### Requirement 10: No Extra Burden Principle

**User Story:** As a busy professional, I want the assistant to save me time and mental effort, so that using it never feels like another task on my plate.

#### Acceptance Criteria

1. THE System SHALL minimize required user input by inferring details rather than requiring forms
2. THE System SHALL allow capturing a task faster than doing it manually (under 10 seconds for simple tasks)
3. THE System SHALL NOT require users to manually tag tasks with priorities or drag them on timelines by default
4. THE System SHALL handle scheduling and prioritization automatically unless the user chooses to override
5. WHEN a feature requires user configuration THEN THE System SHALL provide sensible defaults that work without configuration

### Requirement 11: Adaptation Over Perfection Principle

**User Story:** As someone whose plans constantly change, I want a system that embraces change rather than enforcing rigid plans, so that I never feel guilty about adjusting.

#### Acceptance Criteria

1. THE System SHALL treat re-planning as a natural part of the process, not a failure
2. THE System SHALL NEVER display guilt-inducing language about changed or missed tasks
3. WHEN a task is not completed as scheduled THEN THE System SHALL automatically reschedule without requiring user action
4. THE System SHALL prefer updating and iterating a plan over enforcing the original plan
5. THE UI SHALL always reflect the current truth (dynamic updates) rather than a static baseline plan

### Requirement 12: Clarity Over Completeness Principle

**User Story:** As someone who gets overwhelmed easily, I want to see only what matters right now, so that I can focus without anxiety.

#### Acceptance Criteria

1. THE System SHALL surface information selectively for focus rather than showing everything at once
2. THE Plan_View SHALL highlight the top 3-5 tasks that matter today rather than showing an exhaustive list
3. THE System SHALL use simple, concrete language in all communications (no complex project jargon)
4. WHEN a choice exists between detailed completeness and clear essentials THEN THE System SHALL choose clarity
5. THE System SHALL always answer "What do I do next?" with a single clear recommendation

### Requirement 13: Decision-Ready Outputs Principle

**User Story:** As someone with decision fatigue, I want the assistant to do the thinking for me and present ready-to-act recommendations, so that I can simply approve or tweak.

#### Acceptance Criteria

1. THE System SHALL propose priority orders with reasoning rather than asking users to prioritize
2. THE System SHALL present filled schedules for approval rather than blank slates to fill
3. WHEN a decision is needed THEN THE System SHALL present 2-3 concrete options rather than open-ended questions
4. THE System SHALL provide context with every recommendation (e.g., "I suggest Task A first because it's due tomorrow")
5. THE System SHALL reduce decision fatigue by making recommendations the user can simply confirm

### Requirement 14: Context-Preserving Principle

**User Story:** As a user, I want all relevant context to travel with my tasks, so that I never have to remember or re-explain why something matters.

#### Acceptance Criteria

1. WHEN a task is created from a larger goal THEN THE System SHALL preserve the parent context and link
2. THE System SHALL store and display the original input/request that generated each task
3. WHEN displaying a task THEN THE System SHALL show relevant context (deadline reason, dependencies, related tasks)
4. IF a task is paused and resumed later THEN THE System SHALL surface context to help the user remember where they left off
5. THE System SHALL allow attaching notes or context to any task

### Requirement 15: Minimal UI Friction Principle

**User Story:** As a user, I want interactions to feel as smooth as talking to a helpful colleague, so that using the app never interrupts my flow.

#### Acceptance Criteria

1. THE System SHALL support natural language commands for all common actions
2. THE System SHALL provide one-click/one-tap shortcuts for frequent actions (Done, Defer, Snooze)
3. THE System SHALL load quickly and respond to actions within 2 seconds
4. THE System SHALL allow quick task capture at any time without navigating away from current view
5. WHEN a user enters something incorrectly THEN THE System SHALL handle it gracefully with clarification rather than errors

### Requirement 16: User Control and Trust Principle

**User Story:** As a user, I want to always be in control and understand why the assistant makes suggestions, so that I trust it with my work.

#### Acceptance Criteria

1. THE System SHALL be transparent about why it makes each suggestion (show reasoning)
2. THE System SHALL allow users to override any automatic decision without friction
3. THE System SHALL NOT require confirmation loops ("Are you sure?") for routine actions
4. WHEN the user overrides a suggestion THEN THE System SHALL adapt without protest
5. THE System SHALL allow users to ask "Why did you suggest this?" and receive a clear explanation

### Requirement 17: Privacy and Security Principle

**User Story:** As a professional handling sensitive work, I want my task data kept private and secure, so that I can trust the system with real information.

#### Acceptance Criteria

1. THE System SHALL store task data securely in online storage with appropriate access controls
2. THE System SHALL NOT share user data with third parties without explicit consent
3. THE System SHALL allow users to explicitly delete their data when requested
4. WHEN using AI services THEN THE System SHALL minimize data sent and not log sensitive content
5. THE System SHALL clearly communicate what data is stored and where

### Requirement 18: Focus on Follow-Through Principle

**User Story:** As someone who struggles with execution, I want the system optimized for actually getting things done, so that I see real results.

#### Acceptance Criteria

1. THE System SHALL prioritize features that help users complete tasks over features that help organize tasks
2. THE System SHALL track and display task completion rates to show progress
3. THE System SHALL provide "Just Start" functionality to help users begin difficult tasks
4. WHEN a user is stuck THEN THE System SHALL offer to break the task into even smaller steps
5. THE System SHALL celebrate progress to reinforce follow-through behavior

### Requirement 19: Calendar Integration (Deferred Phase)

**User Story:** As a professional with a busy calendar, I want my tasks scheduled around my existing commitments, so that my plan is realistic.

#### Acceptance Criteria

1. WHEN calendar integration is enabled THEN THE System SHALL read existing calendar events
2. THE System SHALL schedule tasks only in available time slots (not overlapping with calendar events)
3. WHEN a new calendar event is added that conflicts with a scheduled task THEN THE System SHALL automatically reschedule the task
4. THE System SHALL allow users to block specific times as unavailable for tasks
5. THE System SHALL respect user-defined working hours when scheduling tasks

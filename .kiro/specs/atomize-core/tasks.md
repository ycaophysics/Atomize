# Implementation Plan: Atomize Core

## Overview

This implementation plan builds Atomize incrementally, starting with core data models and working up to the full conversational interface. Calendar integration is deferred to the final phase as requested. The stack is TypeScript + Next.js with an abstract LLM provider supporting both Gemini (cloud) and Ollama (local).

## Tasks

- [x] 1. Project Setup and Core Infrastructure
  - [x] 1.1 Initialize Next.js project with TypeScript
    - Create Next.js app with App Router
    - Configure TypeScript strict mode
    - Set up ESLint and Prettier
    - _Requirements: 15.3 (fast loading)_

  - [x] 1.2 Set up testing infrastructure
    - Install Jest and fast-check for property-based testing
    - Configure test scripts and coverage
    - Create test utilities and helpers
    - _Requirements: Testing Strategy_

  - [x] 1.3 Create abstract LLM provider interface
    - Define LLMProvider interface with generate() method
    - Implement GeminiProvider for cloud
    - Implement OllamaProvider for local LLM
    - Add provider factory with config-based selection
    - _Requirements: 17.4 (minimize data sent to AI)_

- [x] 2. Data Models and Storage Layer
  - [x] 2.1 Implement core Task data model
    - Create Task interface with all fields (id, title, description, rawInput, parentId, childIds, deadline, scheduledDate, estimatedMinutes, priority, priorityReason, status, context, history)
    - Create TaskInput, TaskUpdate, TaskFilter types
    - Create TaskHistoryEntry type for append-only history
    - _Requirements: 9.1, 14.1, 14.2_

  - [ ]* 2.2 Write property test for Task data model
    - **Property 12: Priority classification validity**
    - **Validates: Requirements 3.1**

  - [x] 2.3 Implement TaskStore with append-only semantics
    - Create TaskStore class with CRUD operations
    - Implement explicit modification enforcement (throw if explicit=false)
    - Implement history appending on every change
    - Add JSON export functionality
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.7, 9.8_

  - [ ]* 2.4 Write property tests for TaskStore
    - **Property 26: Data persistence round-trip**
    - **Property 27: Explicit modification required**
    - **Property 28: Minimum change enforcement**
    - **Property 29: Completed task retention**
    - **Property 32: History append-only**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.9**

  - [x] 2.5 Implement online storage adapter
    - Create StorageAdapter interface
    - Implement localStorage adapter for development
    - Add immediate save after every mutation
    - _Requirements: 9.1, 9.6, 9.7_

- [ ] 3. Checkpoint - Data Layer Complete
  - Ensure all data layer tests pass
  - Verify append-only semantics work correctly
  - Ask the user if questions arise

- [x] 4. Priority Engine
  - [x] 4.1 Implement PriorityEngine
    - Create calculatePriority() with deadline-based rules
    - Implement prioritizeTasks() for sorting
    - Implement getNextTask() for next recommendation
    - Always include priorityReason in results
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

  - [ ]* 4.2 Write property tests for PriorityEngine
    - **Property 13: Deadline-based priority**
    - **Property 15: Task ordering**
    - **Property 16: Priority reasoning**
    - **Validates: Requirements 3.2, 3.3, 3.5, 3.6**

  - [x] 4.3 Implement priority override
    - Add manual priority setting that persists
    - Ensure override is recorded in history
    - _Requirements: 3.4_

  - [ ]* 4.4 Write property test for priority override
    - **Property 14: Priority override**
    - **Validates: Requirements 3.4**

- [x] 5. Atomization Engine
  - [x] 5.1 Implement AtomizationEngine core
    - Create atomize() method using LLM provider
    - Implement time estimation logic
    - Ensure micro-tasks are 15-60 minutes
    - Generate action-oriented titles (start with verbs)
    - _Requirements: 2.1, 2.2, 2.5, 2.7_

  - [ ]* 5.2 Write property tests for atomization
    - **Property 5: Micro-task time bounds**
    - **Property 6: Action-oriented phrasing**
    - **Property 9: Time estimate presence**
    - **Validates: Requirements 2.1, 2.2, 2.5**

  - [x] 5.3 Implement dependency detection and ordering
    - Detect dependencies between micro-tasks
    - Implement topological sort for ordering
    - Mark parallelizable tasks
    - _Requirements: 2.3, 2.4_

  - [ ]* 5.4 Write property tests for dependencies
    - **Property 7: Dependency ordering**
    - **Property 8: Parallelizable marking**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 5.5 Implement MVP suggestion
    - Generate minimum viable progress for tasks with deadlines
    - _Requirements: 2.6_

  - [ ]* 5.6 Write property test for MVP suggestion
    - **Property 10: MVP suggestion for deadlines**
    - **Validates: Requirements 2.6**

  - [x] 5.7 Implement hierarchy preservation
    - Ensure parent-child relationships are maintained
    - Update parent's childIds when creating children
    - Preserve context from parent to child
    - _Requirements: 2.8, 14.1_

  - [ ]* 5.8 Write property test for hierarchy
    - **Property 11: Hierarchy preservation**
    - **Property 31: Context preservation**
    - **Validates: Requirements 2.8, 14.1, 14.2**

- [ ] 6. Checkpoint - AI Engines Complete
  - Ensure all atomization and priority tests pass
  - Test with both Gemini and Ollama providers
  - Ask the user if questions arise

- [x] 7. Clarification Engine
  - [x] 7.1 Implement ClarificationEngine
    - Create needsClarification() to detect ambiguous input
    - Implement generateQuestions() with max 3 questions
    - Implement processClarification() to update understanding
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ]* 7.2 Write property tests for clarification
    - **Property 3: Clarification question limit**
    - **Validates: Requirements 1.4**

  - [x] 7.3 Implement deadline parsing
    - Parse natural language dates ("tomorrow", "next Friday", "in 3 days")
    - Handle relative and absolute date formats
    - _Requirements: 1.6_

  - [ ]* 7.4 Write property test for deadline parsing
    - **Property 4: Deadline parsing round-trip**
    - **Validates: Requirements 1.6**

- [-] 8. Task Manager
  - [x] 8.1 Implement TaskManager
    - Create createTask() that always appends
    - Implement getTask(), getTasks() with filters
    - Implement updateTask() with explicit flag enforcement
    - Implement completeTask() that preserves data
    - Implement deleteTask() with explicit flag enforcement
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.9_

  - [x] 8.2 Implement task filtering methods
    - getTodayTasks() - tasks scheduled for today, max 7
    - getUpcomingTasks() - tasks in next 7 days
    - Apply priority ordering to results
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]* 8.3 Write property tests for task filtering
    - **Property 22: Task date filtering**
    - **Property 23: Today task limit**
    - **Validates: Requirements 6.1, 6.2, 6.4**

- [-] 9. Plan Manager
  - [x] 9.1 Implement PlanManager
    - Create getTodayPlan() with progress tracking
    - Create getWeekPlan() for weekly view
    - Implement rescheduleTask() and deferTask()
    - _Requirements: 6.1, 6.2, 6.6_

  - [ ]* 9.2 Write property tests for plan management
    - **Property 17: Next task suggestion**
    - **Property 18: Defer rescheduling**
    - **Property 24: Progress tracking**
    - **Validates: Requirements 4.1, 4.2, 6.6**

  - [x] 9.3 Implement adaptive planning
    - Create adaptPlan() for automatic rescheduling
    - Handle new high-priority tasks
    - Handle deadline changes
    - Always provide explanation for changes
    - _Requirements: 4.3, 4.4, 4.6, 11.3, 11.4_

  - [ ]* 9.4 Write property tests for adaptation
    - **Property 19: High-priority accommodation**
    - **Property 20: Deadline change recalculation**
    - **Property 21: Reschedule explanation**
    - **Validates: Requirements 4.3, 4.4, 4.6**

- [ ] 10. Checkpoint - Core Logic Complete
  - Ensure all manager tests pass
  - Verify end-to-end task flow works
  - Ask the user if questions arise

- [-] 11. Progress and Streak Tracking
  - [x] 11.1 Implement progress tracking
    - Track daily completion counts
    - Calculate and store streaks
    - Handle streak reset on missed days
    - _Requirements: 6.6, 8.3, 8.4_

  - [ ]* 11.2 Write property test for streaks
    - **Property 25: Streak calculation**
    - **Validates: Requirements 8.3**

- [-] 12. Response Engine
  - [x] 12.1 Implement ResponseEngine
    - Create generateTaskCreatedResponse() with positive tone
    - Create generateCompletionResponse() with celebration
    - Create generateCheckIn() for gentle reminders
    - Create generateCelebration() with varied messages
    - _Requirements: 5.3, 5.4, 8.1, 8.2, 8.6_

  - [x] 12.2 Implement explanation generation
    - Create generateExplanation() for decisions
    - Ensure all recommendations include reasoning
    - _Requirements: 13.4, 16.1_

- [-] 13. Conversation Manager
  - [x] 13.1 Implement ConversationManager
    - Create processInput() to handle all user input
    - Integrate with ClarificationEngine for ambiguous input
    - Integrate with AtomizationEngine for task creation
    - Return appropriate response types
    - _Requirements: 1.1, 1.2, 5.1, 5.2_

  - [ ]* 13.2 Write property test for input acceptance
    - **Property 1: Input acceptance**
    - **Property 2: Multi-task extraction completeness**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 13.3 Implement natural language commands
    - Parse commands: "mark done", "defer", "move to tomorrow", etc.
    - Execute corresponding actions
    - _Requirements: 5.1_

  - [x] 13.4 Implement quick actions
    - Generate suggestedActions with common operations
    - Support Done, Defer, Break Down More actions
    - _Requirements: 5.5_

- [ ] 14. Checkpoint - Backend Complete
  - Ensure all backend tests pass
  - Test full conversation flow
  - Ask the user if questions arise

- [-] 15. User Interface - Chat Interface
  - [x] 15.1 Create Chat UI component
    - Build chat message list with user/assistant distinction
    - Create input field with send button
    - Display quick action buttons on responses
    - _Requirements: 15.1, 15.2, 15.4_

  - [x] 15.2 Implement real-time interaction
    - Connect to ConversationManager
    - Show loading states during AI processing
    - Display clarification questions inline
    - _Requirements: 15.3_

- [-] 16. User Interface - Plan View
  - [x] 16.1 Create Plan View component
    - Display Today section with task cards
    - Display Upcoming section (collapsible)
    - Display Later section (collapsed by default)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 16.2 Implement task cards
    - Show title, priority indicator, time estimate
    - Show progress bar for parent tasks
    - Add quick action buttons (Done, Defer)
    - _Requirements: 6.5, 6.6, 5.5_

  - [x] 16.3 Implement progress display
    - Show "X of Y tasks done today"
    - Show current streak
    - Display celebration on completion
    - _Requirements: 6.6, 8.1, 8.2, 8.5_

- [-] 17. User Interface - Task Detail View
  - [x] 17.1 Create Task Detail component
    - Show full task information
    - Display micro-task breakdown
    - Show context and history
    - _Requirements: 14.3, 14.5_

  - [x] 17.2 Implement task editing
    - Allow title/description editing (explicit)
    - Allow deadline changes
    - Allow priority override
    - _Requirements: 3.4, 16.2_

- [-] 18. Notification Manager
  - [x] 18.1 Implement NotificationManager
    - Create scheduleReminder() for task reminders
    - Implement snoozeNotification()
    - Store notification preferences
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 18.2 Implement gentle check-ins
    - Generate supportive reminder messages
    - Offer to break down repeatedly snoozed tasks
    - _Requirements: 7.3, 7.4, 7.6_

- [ ] 19. Checkpoint - MVP Complete
  - Ensure all tests pass
  - Test full user flow end-to-end
  - Verify app works with both Gemini and Ollama
  - Ask the user if questions arise

- [ ] 20. Calendar Integration (Deferred Phase)
  - [ ] 20.1 Implement calendar data model
    - Create CalendarEvent interface
    - Create CalendarProvider interface
    - _Requirements: 19.1_

  - [ ] 20.2 Implement Google Calendar provider
    - OAuth integration for Google Calendar
    - Read existing events
    - _Requirements: 19.1_

  - [ ] 20.3 Implement calendar-aware scheduling
    - Find available time slots
    - Schedule tasks around events
    - _Requirements: 19.2_

  - [ ] 20.4 Implement conflict resolution
    - Detect conflicts with new events
    - Auto-reschedule conflicting tasks
    - _Requirements: 19.3_

  - [ ] 20.5 Implement time blocking
    - Allow users to block unavailable times
    - Respect working hours configuration
    - _Requirements: 19.4, 19.5_

- [ ] 21. Final Checkpoint
  - Ensure all tests pass including calendar integration
  - Full end-to-end testing
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Calendar integration (Task 20) is intentionally last as requested
- LLM provider abstraction allows switching between Gemini and Ollama via config

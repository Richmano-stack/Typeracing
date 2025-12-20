# Private Race Track - Implementation Plan

## Overview
Private race track allows users to create private race rooms, invite friends via shareable links, and race together in real-time. This is the core multiplayer feature.

## Features

### Core Features
1. **Room Creation**
   - Generate unique room ID
   - Set room settings (text selection, max players, etc.)
   - Create shareable invite link

2. **Room Joining**
   - Join via invite link
   - Validate room exists and has space
   - Show room lobby with participants

3. **Real-time Synchronization**
   - Live participant list
   - Real-time progress updates
   - Race start coordination
   - Race completion tracking

4. **Race Management**
   - Countdown before race starts
   - Synchronized race start
   - Progress tracking for all participants
   - Race results and leaderboard

## Technical Architecture

### Database Schema

```prisma
model RaceRoom {
  id          String   @id @default(uuid())
  roomCode   String   @unique // Short, shareable code (e.g., "ABC123")
  hostId     String   // User who created the room
  host       User     @relation("HostedRooms", fields: [hostId], references: [id])
  
  // Settings
  maxPlayers Int     @default(10)
  textId       String? // Optional: specific text, null = random
  isPrivate    Boolean @default(true)
  
  // Status
  status       RoomStatus @default(WAITING) // WAITING, STARTING, IN_PROGRESS, FINISHED
  currentText  String? // Text being used for current race
  
  // Timing
  createdAt    DateTime @default(now())
  startedAt    DateTime?
  finishedAt   DateTime?
  
  // Relations
  participants RaceParticipant[]
  
  @@index([roomCode])
  @@index([hostId])
  @@map("race_rooms")
}

model RaceParticipant {
  id          String   @id @default(uuid())
  roomId      String
  room        RaceRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  userId      String?  // null for guests
  user        User?     @relation("RaceParticipants", fields: [userId], references: [id])
  
  // Guest info (if not logged in)
  guestName   String?
  
  // Race progress
  progress    Float    @default(0) // 0-100
  wpm         Decimal  @default(0) @db.Decimal(5, 2)
  accuracy    Decimal  @default(0) @db.Decimal(5, 2)
  errors      Int      @default(0)
  completedAt DateTime?
  
  // Status
  isReady     Boolean  @default(false)
  isFinished  Boolean  @default(false)
  
  // Timing
  joinedAt    DateTime @default(now())
  startedAt   DateTime?
  
  @@unique([roomId, userId]) // One participant per user per room
  @@index([roomId])
  @@index([userId])
  @@map("race_participants")
}

enum RoomStatus {
  WAITING      // Waiting for players
  STARTING     // Countdown in progress
  IN_PROGRESS  // Race is running
  FINISHED     // Race completed
}
```

### API Endpoints

#### Room Management
```
POST   /api/rooms              - Create new room
GET    /api/rooms/:roomCode    - Get room details
POST   /api/rooms/:roomCode/join    - Join room
POST   /api/rooms/:roomCode/leave    - Leave room
POST   /api/rooms/:roomCode/ready   - Mark participant as ready
DELETE /api/rooms/:roomCode    - Delete room (host only)
```

#### Race Control
```
POST   /api/rooms/:roomCode/start    - Start race (host only)
GET    /api/rooms/:roomCode/status  - Get current race status
POST   /api/rooms/:roomCode/progress - Update participant progress
```

### WebSocket Events

#### Client → Server
```typescript
// Room events
'room:join'        - Join a room
'room:leave'       - Leave a room
'room:ready'       - Mark as ready
'room:start'       - Request race start (host only)

// Race events
'race:progress'    - Update typing progress
'race:complete'    - Notify race completion
'race:error'       - Report typing error
```

#### Server → Client
```typescript
// Room events
'room:joined'      - Successfully joined room
'room:left'        - Left room
'room:participant:joined'  - New participant joined
'room:participant:left'    - Participant left
'room:participant:ready'   - Participant marked ready
'room:status'      - Room status changed

// Race events
'race:starting'    - Race countdown started
'race:started'     - Race has begun
'race:progress'    - Participant progress update
'race:finished'    - Race completed
'race:results'     - Final race results
```

## Implementation Steps

### Phase 1: Database & API Setup (Week 1)

#### Step 1.1: Database Schema
- [ ] Create Prisma migration for RaceRoom and RaceParticipant
- [ ] Update User model with new relations
- [ ] Run migration
- [ ] Update Prisma client

#### Step 1.2: Room API Endpoints
- [ ] Create `/api/rooms` route handler
- [ ] Implement POST `/api/rooms` (create room)
- [ ] Implement GET `/api/rooms/[roomCode]` (get room)
- [ ] Implement POST `/api/rooms/[roomCode]/join`
- [ ] Implement POST `/api/rooms/[roomCode]/leave`
- [ ] Add authentication checks
- [ ] Add validation and error handling

#### Step 1.3: Room Code Generation
- [ ] Create utility function for generating room codes
- [ ] Ensure uniqueness
- [ ] Make codes short and shareable (6-8 characters)

### Phase 2: Real-time Infrastructure (Week 1-2)

#### Step 2.1: WebSocket Setup
- [ ] Install Socket.io (or chosen library)
- [ ] Create WebSocket server setup
- [ ] Configure CORS and authentication
- [ ] Set up connection management

#### Step 2.2: Room Management (WebSocket)
- [ ] Implement room:join event handler
- [ ] Implement room:leave event handler
- [ ] Track connected clients per room
- [ ] Broadcast participant updates
- [ ] Handle disconnections gracefully

#### Step 2.3: Client Integration
- [ ] Create WebSocket hook (`useWebSocket`)
- [ ] Connect to WebSocket on room page
- [ ] Handle connection states
- [ ] Implement reconnection logic

### Phase 3: Room UI (Week 2)

#### Step 3.1: Room Creation Page
- [ ] Update `/race/create` page
- [ ] Add room settings (max players, text selection)
- [ ] Generate room code and link
- [ ] Show shareable link with copy button
- [ ] Redirect to room lobby after creation

#### Step 3.2: Room Lobby Page
- [ ] Create `/race/room/[roomCode]` page
- [ ] Display room code and settings
- [ ] Show participant list with ready status
- [ ] Display invite link
- [ ] Add "Ready" button
- [ ] Show "Start Race" button (host only)
- [ ] Real-time updates via WebSocket

#### Step 3.3: Room Joining
- [ ] Create `/race/invite/[roomCode]` page
- [ ] Validate room exists and has space
- [ ] Auto-join room
- [ ] Redirect to lobby
- [ ] Handle errors (room full, not found, etc.)

### Phase 4: Race Synchronization (Week 2-3)

#### Step 4.1: Race Start Coordination
- [ ] Implement race start logic
- [ ] Countdown synchronization (3-2-1)
- [ ] Broadcast race start to all participants
- [ ] Update room status to IN_PROGRESS
- [ ] Initialize race for all participants

#### Step 4.2: Progress Updates
- [ ] Send progress updates via WebSocket
- [ ] Update participant progress in database
- [ ] Broadcast to other participants
- [ ] Optimize update frequency (throttle to ~500ms)

#### Step 4.3: Race Completion
- [ ] Detect race completion
- [ ] Send completion event
- [ ] Calculate final results
- [ ] Update room status to FINISHED
- [ ] Display results page

### Phase 5: Results & Polish (Week 3)

#### Step 5.1: Results Display
- [ ] Create results component
- [ ] Show leaderboard with all participants
- [ ] Display WPM, accuracy, errors for each
- [ ] Highlight winner
- [ ] Add "Race Again" option
- [ ] Add "Leave Room" option

#### Step 5.2: Error Handling
- [ ] Handle network disconnections
- [ ] Handle room not found
- [ ] Handle room full
- [ ] Handle race already started
- [ ] Show user-friendly error messages

#### Step 5.3: Testing
- [ ] Test with 2+ users
- [ ] Test room creation and joining
- [ ] Test race synchronization
- [ ] Test disconnection scenarios
- [ ] Test edge cases

## File Structure

```
app/
  (race)/
    create/
      page.tsx              # Room creation (update existing)
    room/
      [roomCode]/
        page.tsx            # Room lobby and race
    invite/
      [roomCode]/
        page.tsx            # Join room via invite
  api/
    rooms/
      route.ts              # Room CRUD operations
      [roomCode]/
        route.ts            # Room details
        join/
          route.ts          # Join room
        leave/
          route.ts          # Leave room
        start/
          route.ts          # Start race
        progress/
          route.ts          # Update progress
    websocket/
      route.ts              # WebSocket handler (if using API route)
lib/
  websocket/
    client.ts               # WebSocket client setup
    hooks.ts                # useWebSocket hook
    events.ts               # Event type definitions
  rooms/
    roomCode.ts             # Room code generation
    validation.ts            # Room validation logic
hooks/
  useRoom.ts               # Room state management hook
  useRaceRoom.ts           # Race room specific hook
```

## Testing Checklist

### Room Management
- [ ] Can create room as authenticated user
- [ ] Can create room as guest (with guest name)
- [ ] Room code is unique
- [ ] Can join room via invite link
- [ ] Can leave room
- [ ] Room is deleted when host leaves
- [ ] Cannot join full room
- [ ] Cannot join non-existent room

### Real-time Features
- [ ] Participants see each other join/leave in real-time
- [ ] Ready status updates in real-time
- [ ] Race starts simultaneously for all participants
- [ ] Progress updates appear in real-time
- [ ] Results appear when race completes

### Race Flow
- [ ] All participants see same text
- [ ] Countdown is synchronized
- [ ] Race starts at same time for all
- [ ] Progress tracking works correctly
- [ ] Results are accurate
- [ ] Can start new race in same room

## Security Considerations

- [ ] Validate room ownership before allowing start/delete
- [ ] Rate limit room creation
- [ ] Validate room codes to prevent enumeration
- [ ] Sanitize guest names
- [ ] Limit max players per room
- [ ] Add timeout for inactive rooms
- [ ] Validate WebSocket connections
- [ ] Prevent race manipulation

## Performance Considerations

- [ ] Throttle progress updates (don't send every keystroke)
- [ ] Limit room size to prevent overload
- [ ] Clean up inactive rooms
- [ ] Optimize database queries
- [ ] Use connection pooling for WebSocket
- [ ] Cache room data when possible

## Future Enhancements

- Custom text input for rooms
- Room settings (difficulty, time limit)
- Spectator mode
- Room chat
- Room history
- Replay functionality

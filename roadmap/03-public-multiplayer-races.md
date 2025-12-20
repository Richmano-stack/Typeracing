# Public Multiplayer Races - Implementation Plan

## Overview
Public multiplayer races allow users to join open race lobbies and compete with random players. This complements the private race system.

## Features

### Core Features
1. **Public Lobby System**
   - Browse available public races
   - Filter by difficulty, player count, status
   - Auto-match with similar skill level

2. **Quick Join**
   - Join race with one click
   - Auto-assign to available race
   - Show race details before joining

3. **Race Types**
   - Standard race (random text)
   - Time trial (fixed time limit)
   - Accuracy challenge (focus on accuracy)
   - Speed challenge (focus on speed)

4. **Matchmaking**
   - Skill-based matching (based on avg WPM)
   - Fill races efficiently
   - Create new race if none available

## Technical Architecture

### Database Schema

```prisma
model PublicRace {
  id          String   @id @default(uuid())
  raceType    RaceType
  difficulty  Difficulty @default(MEDIUM)
  maxPlayers  Int      @default(10)
  minPlayers  Int      @default(2)
  
  // Status
  status      RaceStatus @default(WAITING)
  currentText String?
  
  // Matchmaking
  avgSkillLevel Decimal? @db.Decimal(5, 2) // Average WPM of participants
  
  // Timing
  createdAt   DateTime @default(now())
  startedAt   DateTime?
  finishedAt  DateTime?
  
  // Relations
  participants RaceParticipant[]
  
  @@index([status, raceType])
  @@index([status, difficulty])
  @@map("public_races")
}

enum RaceType {
  STANDARD      // Random text
  TIME_TRIAL    // Fixed time limit
  ACCURACY      // Accuracy focused
  SPEED         // Speed focused
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  EXPERT
}
```

### API Endpoints

```
GET    /api/races/public           - List available public races
POST   /api/races/public/join      - Join or create public race
GET    /api/races/public/:id       - Get public race details
POST   /api/races/public/:id/leave - Leave public race
```

### Matchmaking Algorithm

1. Calculate user's skill level (avg WPM from last 10 races)
2. Find races with:
   - Status = WAITING
   - Similar skill level (±20 WPM)
   - Available slots
3. If found, join race
4. If not found, create new race
5. Wait for minimum players before starting

## Implementation Steps

### Phase 1: Database & API (Week 1)
- [ ] Create PublicRace model
- [ ] Create API endpoints
- [ ] Implement matchmaking logic
- [ ] Add skill level calculation

### Phase 2: UI Components (Week 1-2)
- [ ] Create public races browser page
- [ ] Add race type filters
- [ ] Implement quick join button
- [ ] Show race details modal

### Phase 3: Integration (Week 2)
- [ ] Integrate with existing race system
- [ ] Add to navigation
- [ ] Test matchmaking
- [ ] Polish UI

## Future Enhancements
- Ranked races
- Tournaments
- Daily challenges
- Seasonal events

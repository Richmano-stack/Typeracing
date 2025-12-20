# Leaderboards - Implementation Plan

## Overview
Global and friend leaderboards to showcase top performers and encourage competition.

## Features

### Core Features
1. **Global Leaderboards**
   - Overall WPM leaderboard
   - Weekly/Monthly/All-time rankings
   - Accuracy leaderboard
   - Most races completed

2. **Friend Leaderboards**
   - Compare with friends
   - Friend rankings
   - Challenge friends

3. **Category Leaderboards**
   - By difficulty level
   - By race type
   - By time period

## Database Schema

```prisma
model LeaderboardEntry {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // Rankings
  globalRank  Int?
  weeklyRank  Int?
  monthlyRank Int?
  
  // Metrics
  bestWpm     Decimal  @db.Decimal(5, 2)
  avgWpm      Decimal  @db.Decimal(5, 2)
  totalRaces  Int
  avgAccuracy Decimal  @db.Decimal(5, 2)
  
  // Period
  period      LeaderboardPeriod @default(ALL_TIME)
  updatedAt   DateTime @default(now()) @updatedAt
  
  @@unique([userId, period])
  @@index([globalRank])
  @@index([weeklyRank])
  @@index([monthlyRank])
  @@map("leaderboard_entries")
}

enum LeaderboardPeriod {
  WEEKLY
  MONTHLY
  ALL_TIME
}
```

## API Endpoints

```
GET /api/leaderboards/global        - Global leaderboard
GET /api/leaderboards/weekly        - Weekly leaderboard
GET /api/leaderboards/monthly        - Monthly leaderboard
GET /api/leaderboards/friends       - Friend leaderboard
GET /api/leaderboards/user/:id      - User's ranking
```

## Implementation Steps

### Phase 1: Database & Calculations (Week 1)
- [ ] Create LeaderboardEntry model
- [ ] Create background job to calculate rankings
- [ ] Update rankings when race completes
- [ ] Implement ranking algorithm

### Phase 2: API & Data (Week 1)
- [ ] Create leaderboard API endpoints
- [ ] Add pagination
- [ ] Add filtering and sorting
- [ ] Cache leaderboard data

### Phase 3: UI (Week 2)
- [ ] Create leaderboard page
- [ ] Display rankings table
- [ ] Show user's position
- [ ] Add filters (period, category)
- [ ] Add friend comparison

### Phase 4: Real-time Updates (Week 2)
- [ ] Update leaderboard after race
- [ ] Show rank changes
- [ ] Notify of rank milestones

## Future Enhancements
- Achievements and badges
- Hall of fame
- Regional leaderboards
- Team competitions

# Social Features - Implementation Plan

## Overview
Social features to connect users, compare progress, and enhance engagement.

## Features

### Core Features
1. **Friends System**
   - Send/accept friend requests
   - Friend list
   - Friend activity feed
   - Friend comparisons

2. **User Profiles**
   - Public profile pages
   - Statistics display
   - Recent races
   - Achievements

3. **Achievements**
   - Unlock achievements
   - Display badges
   - Progress tracking
   - Share achievements

4. **Activity Feed**
   - Recent races
   - Achievements unlocked
   - Friend activity
   - Personal milestones

## Database Schema

```prisma
model Friendship {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation("UserFriends", fields: [userId], references: [id])
  friendId    String
  friend      User     @relation("FriendOf", fields: [friendId], references: [id])
  
  status      FriendshipStatus @default(PENDING)
  createdAt   DateTime @default(now())
  acceptedAt  DateTime?
  
  @@unique([userId, friendId])
  @@index([userId, status])
  @@map("friendships")
}

model Achievement {
  id          String   @id @default(uuid())
  code        String   @unique // e.g., "FIRST_RACE", "100_WPM"
  name        String
  description String
  icon        String?
  category    AchievementCategory
  
  userAchievements UserAchievement[]
  
  @@map("achievements")
}

model UserAchievement {
  id            String      @id @default(uuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  achievementId String
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  
  unlockedAt    DateTime    @default(now())
  progress      Int?        // For progressive achievements
  
  @@unique([userId, achievementId])
  @@index([userId])
  @@map("user_achievements")
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  BLOCKED
}

enum AchievementCategory {
  RACES
  SPEED
  ACCURACY
  STREAK
  SOCIAL
  MILESTONE
}
```

## API Endpoints

### Friends
```
GET    /api/friends              - Get friend list
POST   /api/friends/request     - Send friend request
POST   /api/friends/:id/accept  - Accept friend request
POST   /api/friends/:id/decline - Decline friend request
DELETE /api/friends/:id         - Remove friend
```

### Achievements
```
GET    /api/achievements         - List all achievements
GET    /api/achievements/user   - User's achievements
POST   /api/achievements/check   - Check and unlock achievements
```

### Activity
```
GET    /api/activity             - User activity feed
GET    /api/activity/friends    - Friends' activity
```

## Implementation Steps

### Phase 1: Friends System (Week 1-2)
- [ ] Create Friendship model
- [ ] Create friend request API
- [ ] Create friend list UI
- [ ] Add friend search
- [ ] Implement friend requests

### Phase 2: Profiles (Week 2)
- [ ] Create public profile page
- [ ] Display user statistics
- [ ] Show recent races
- [ ] Add profile customization

### Phase 3: Achievements (Week 2-3)
- [ ] Create Achievement models
- [ ] Define achievement list
- [ ] Implement achievement checking
- [ ] Create achievement display
- [ ] Add achievement notifications

### Phase 4: Activity Feed (Week 3)
- [ ] Create activity tracking
- [ ] Build activity feed API
- [ ] Create activity feed UI
- [ ] Add real-time updates

## Future Enhancements
- Direct messaging
- Groups/teams
- Challenges between friends
- Social sharing
- Integration with social media

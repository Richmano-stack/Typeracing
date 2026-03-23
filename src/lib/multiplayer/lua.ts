export const LUA_SCRIPTS = {
  // Ensures only one guest can join and state moves to LOBBY_FULL
  JOIN_ROOM: `
    local key = KEYS[1]
    local guestId = ARGV[1]
    local nowMs = ARGV[2]
    local state = redis.call('HGET', key, 'state')
    local existingGuest = redis.call('HGET', key, 'guest_id')

    if state ~= 'WAITING_FOR_GUEST' then return 'ERROR_STATE' end
    if existingGuest and existingGuest ~= '' then return 'ERROR_FULL' end

    -- Set ready_deadline_ms (60 seconds from now)
    local deadline = tostring(tonumber(nowMs) + 60000)
    
    redis.call('HSET', key, 'guest_id', guestId, 'state', 'LOBBY_FULL', 'ready_deadline_ms', deadline)
    return 'OK'
  `,


  // Ensures only the first 'Finish' event triggers the DB persistence logic
  PERSIST_LOCK: `
    local key = KEYS[1]
    local alreadyPersisted = redis.call('HGET', key, 'persisted_to_db')
    if alreadyPersisted == '1' then return 0 end
    redis.call('HSET', key, 'persisted_to_db', '1')
    return 1
  `,

  // Handles either player readying up.
  // Transitions state to READY_CHECK if BOTH players are now ready.
  READY_UP: `
    local key = KEYS[1]
    local userId = ARGV[1]
    
    local hostId = redis.call('HGET', key, 'host_id')
    local guestId = redis.call('HGET', key, 'guest_id')
    
    local role = nil
    if userId == hostId then role = 'host' end
    if userId == guestId then role = 'guest' end
    
    if role == nil then return 'ERROR_UNAUTHORIZED' end
    
    redis.call('HSET', key, role .. '_ready', '1')
    
    local hR = redis.call('HGET', key, 'host_ready')
    local gR = redis.call('HGET', key, 'guest_ready')
    
    if hR == '1' and gR == '1' then
      redis.call('HSET', key, 'state', 'READY_CHECK')
      return 'READY_CHECK'
    end
    
    return 'OK'
  `,

  // Transition from READY_CHECK to COUNTDOWN
  START_RACE: `
    local key = KEYS[1]
    local hostUserId = ARGV[1]
    local targetStartMs = ARGV[2]
    
    local hostId = redis.call('HGET', key, 'host_id')
    local state = redis.call('HGET', key, 'state')
    
    if hostUserId ~= hostId then return 'ERROR_UNAUTHORIZED' end
    if state ~= 'READY_CHECK' then return 'ERROR_STATE' end
    
    redis.call('HSET', key, 'state', 'COUNTDOWN', 'target_start_ms', targetStartMs)
    return 'OK'
  `,

  // Atomically set a player's finish time if not already set
  SET_FINISH: `
    local key = KEYS[1]
    local field = ARGV[1]
    local time = ARGV[2]
    local existing = redis.call('HGET', key, field)
    if existing == false or existing == '' or existing == '0' then
      redis.call('HSET', key, field, time)
      return 1
    end
    return 0
  `,

  // Handle room abandonment/forfeit or timeout transition
  SET_STATE: `
    local key = KEYS[1]
    local state = ARGV[1]
    redis.call('HSET', key, 'state', state)
    return 'OK'
  `,

  // Resolve winner specifically by comparing timestamps
  RESOLVE_WINNER: `
    local key = KEYS[1]
    local winnerId = ARGV[1]
    redis.call('HSET', key, 'state', 'FINISHED', 'winner_id', winnerId)
    return 'OK'
  `,

  // Atomic Sync: Updates progress AND checks for finish/winner in one go
  SYNC_PROGRESS: `
    local key = KEYS[1]
    local userId = ARGV[1]
    local progress = tonumber(ARGV[2])
    local wpm = tonumber(ARGV[3])
    local nowMs = ARGV[4]
    
    local hostId = redis.call('HGET', key, 'host_id')
    local guestId = redis.call('HGET', key, 'guest_id')
    
    local role = nil
    if userId == hostId then role = 'host' end
    if userId == guestId then role = 'guest' end
    if role == nil then return 'ERROR_UNAUTHORIZED' end
    
    -- 1. Update basic fields
    redis.call('HSET', key, role .. '_progress', tostring(progress), role .. '_wpm', tostring(wpm), role .. '_last_active', nowMs)
    
    -- 2. Handle Finish Timestamp
    local finishedField = role .. '_finished_ms'
    local existingFinished = redis.call('HGET', key, finishedField)
    if progress >= 100 and (existingFinished == false or existingFinished == '' or existingFinished == '0') then
      redis.call('HSET', key, finishedField, nowMs)
    end
    
    -- 3. Check for transitions
    local state = redis.call('HGET', key, 'state')
    
    -- 3.1 Ready Deadline Check
    if state == 'LOBBY_FULL' then
      local deadline = tonumber(redis.call('HGET', key, 'ready_deadline_ms') or '0')
      if deadline > 0 and tonumber(nowMs) > deadline then
        local guestReady = redis.call('HGET', key, 'guest_ready')
        if guestReady ~= '1' then
          state = 'ABANDONED'
          redis.call('HSET', key, 'state', state)
        end
      end
    end

    -- 3.2 Countdown -> In Progress
    local targetStartMs = tonumber(redis.call('HGET', key, 'target_start_ms') or '0')
    if state == 'COUNTDOWN' and tonumber(nowMs) >= targetStartMs then
      state = 'IN_PROGRESS'
      redis.call('HSET', key, 'state', state)
    end
    
    -- 4. In-Game Logic (Disconnects & Winner Resolution)
    if state == 'IN_PROGRESS' then
      -- A. Heartbeat Disconnect Detection
      local opponentRole = (role == 'host') and 'guest' or 'host'
      local opponentLastActive = tonumber(redis.call('HGET', key, opponentRole .. '_last_active') or '0')
      if opponentLastActive > 0 and (tonumber(nowMs) - opponentLastActive > 5000) then
         redis.call('HSET', key, 'state', 'FINISHED', 'winner_id', userId)
         state = 'FINISHED'
      end

      -- B. Regular Winner Resolution (Both Finished)
      if state == 'IN_PROGRESS' then
        local hFin = tonumber(redis.call('HGET', key, 'host_finished_ms') or '0')
        local gFin = tonumber(redis.call('HGET', key, 'guest_finished_ms') or '0')
        local existingWinner = redis.call('HGET', key, 'winner_id')
        
        if hFin > 0 and gFin > 0 and (existingWinner == false or existingWinner == '') then
          local winnerId = hostId
          if gFin < hFin then winnerId = guestId end
          redis.call('HSET', key, 'state', 'FINISHED', 'winner_id', winnerId)
        end
      end
    end
    
    -- Return everything needed back to the app
    return redis.call('HGETALL', key)
  `
};



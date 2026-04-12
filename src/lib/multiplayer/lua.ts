export const LUA_SCRIPTS = {
  // Ensures only one guest can join and state moves to LOBBY_FULL
  JOIN_ROOM: `
    local key = KEYS[1]
    local guestId = ARGV[1]
    local nowMs = ARGV[2]
    local state = redis.call('HGET', key, 'state')
    local hostId = redis.call('HGET', key, 'host_id')
    local existingGuest = redis.call('HGET', key, 'guest_id')

    -- Self-join: host cannot be guest
    if guestId == hostId then return 'ERROR_SELF_JOIN' end

    -- Idempotent re-entry: already the guest? That's fine.
    if existingGuest == guestId then return 'OK_ALREADY_IN' end

    -- Lobby Timeout: Check if room is older than 5 minutes
    local createdAt = tonumber(redis.call('HGET', key, 'created_at_ms') or '0')
    if createdAt > 0 and (tonumber(nowMs) - createdAt > 300000) then return 'ERROR_EXPIRED' end

    if state ~= 'WAITING_FOR_GUEST' then return 'ERROR_STATE' end
    if existingGuest and existingGuest ~= '' then return 'ERROR_FULL' end

    -- Set ready_deadline_ms (60 seconds from now)
    local deadline = tostring(tonumber(nowMs) + 60000)
    
    redis.call('HSET', key, 'guest_id', guestId, 'state', 'LOBBY_FULL', 'ready_deadline_ms', deadline)
    return 'OK'
  `,


  // Used to ensure a participant only saves their results to the DB once
  INDIVIDUAL_PERSIST_LOCK: `
    local key = KEYS[1]
    local role = ARGV[1]
    local field = role .. '_persisted_to_db'
    local alreadyPersisted = redis.call('HGET', key, field)
    if alreadyPersisted == '1' then return 0 end
    redis.call('HSET', key, field, '1')
    return 1
  `,

  // Handles either player readying up.
  // Transitions state to READY_CHECK if BOTH players are now ready.
  READY_UP: `
    local key = KEYS[1]
    local userId = ARGV[1]
    
    local state = redis.call('HGET', key, 'state')
    if state ~= 'LOBBY_FULL' then return 'ERROR_STATE' end
    
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

  // Transition from READY_CHECK to COUNTDOWN with higher precision and idempotency
  MULTIPLAYER_START: `
    local key = KEYS[1]
    local userId = ARGV[1]
    local targetStartMs = ARGV[2]
    
    local data = redis.call('HMGET', key, 'state', 'host_id', 'guest_id', 'guest_ready', 'target_start_ms')
    local state = data[1]
    local hostId = data[2]
    local guestId = data[3]
    local guestReady = data[4]
    local existingTarget = data[5]

    -- 1. Existence Check
    if not state then return 'ERROR_NOT_FOUND' end

    -- 2. Identity Guard
    if userId ~= hostId and userId ~= guestId then return 'ERROR_FORBIDDEN' end

    -- 3. Idempotency Guard
    if state == 'COUNTDOWN' then
      return 'ALREADY_STARTING:' .. existingTarget
    end

    -- 4. Readiness Guard
    if not guestId or guestId == '' then return 'ERROR_NO_GUEST' end
    if guestReady ~= '1' then return 'ERROR_NOT_READY' end
    if state ~= 'READY_CHECK' then return 'ERROR_STATE' end

    -- 5. Commit
    redis.call('HSET', key, 'state', 'COUNTDOWN', 'target_start_ms', targetStartMs)
    -- Extend TTL to 1 hour from now to ensure it doesn't expire during race
    redis.call('EXPIRE', key, 3600) 
    
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

  // Atomically update last_active and check for timeouts
  LOBBY_HEARTBEAT: `
    local key = KEYS[1]
    local userId = ARGV[1]
    local nowMs = tonumber(ARGV[2])
    
    local data = redis.call('HMGET', key, 'state', 'host_id', 'guest_id', 'host_last_active', 'guest_last_active')
    local state = data[1]
    local hostId = data[2]
    local guestId = data[3]
    local hLA = tonumber(data[4] or '0')
    local gLA = tonumber(data[5] or '0')

    if not state then return 'ERROR_NOT_FOUND' end

    local role = nil
    local opponentLastActive = 0
    if userId == hostId then 
      role = 'host'
      opponentLastActive = gLA
    elseif userId == guestId then 
      role = 'guest'
      opponentLastActive = hLA
    end

    if not role then return 'ERROR_UNAUTHORIZED' end

    -- Update requester last active
    redis.call('HSET', key, role .. '_last_active', tostring(nowMs))

    -- Abandonment Detection: If opponent hasn't pinged in 5s status is DISCONNECTED
    local isOpponentDisconnected = 0
    if (opponentLastActive > 0) and (nowMs - opponentLastActive > 5000) then
      isOpponentDisconnected = 1
    end
    
    return state .. ':' .. isOpponentDisconnected
  `,

  // THE BRAIN: The high-frequency heart of the race.
  // KEYS[1] = roomKey
  // ARGS[1] = userId, ARGS[2] = progress, ARGS[3] = wpm
  SYNC_PULSE: `
    local key = KEYS[1]
    local userId = ARGV[1]
    local progress = tonumber(ARGV[2])
    local wpm = tonumber(ARGV[3])
    
    -- Authoritative Server Time
    local time = redis.call('TIME')
    local nowMs = (tonumber(time[1]) * 1000) + math.floor(tonumber(time[2]) / 1000)
    
    local data = redis.call('HMGET', key, 'state', 'host_id', 'guest_id', 'target_start_ms', 'winner_id', 'prompt_text')
    local state = data[1]
    local hostId = data[2]
    local guestId = data[3]
    local targetStartMs = tonumber(data[4] or '0')
    local winnerId = data[5]
    local promptText = data[6] or ''

    if not state then return 'ERROR_NOT_FOUND' end

    -- 1. Identity Check
    local role = nil
    local opponentRole = nil
    if userId == hostId then 
      role = 'host'
      opponentRole = 'guest'
    elseif userId == guestId then 
      role = 'guest'
      opponentRole = 'host'
    end
    if not role then return 'ERROR_UNAUTHORIZED' end

    -- 2. State Gatekeeper (The Lazy Start)
    if state == 'COUNTDOWN' then
      if nowMs >= targetStartMs then
        redis.call('HSET', key, 'state', 'IN_PROGRESS')
        state = 'IN_PROGRESS'
      else
        -- Reject jump-start
        if progress > 0 then return 'ERROR_WAITING' end
      end
    end

    -- 3. TTL Check / Post-Finish Lock
    if state == 'COUNTDOWN' or state == 'IN_PROGRESS' then
      local elapsed = nowMs - targetStartMs
      if targetStartMs > 0 and elapsed >= 120000 then
        state = 'FINISHED'
        redis.call('HSET', key, 'state', 'FINISHED')
      end
    end

    if state == 'FINISHED' then
      local oppData = redis.call('HMGET', key, opponentRole .. '_progress', opponentRole .. '_wpm', opponentRole .. '_finished_ms')
      local oppFinished = '0'
      if oppData[3] and oppData[3] ~= '' and oppData[3] ~= '0' then oppFinished = '1' end
      return 'FINISHED:' .. (winnerId or '') .. ':' .. (oppData[1] or '0') .. ':' .. (oppData[2] or '0') .. ':' .. tostring(targetStartMs) .. ':' .. (promptText or '') .. ':' .. oppFinished
    end

    -- 4. Anti-Cheat (The Teleport Check)
    -- If they have > 10% progress but race just started (< 500ms), or WPM > 350
    if state == 'IN_PROGRESS' then
      local elapsed = nowMs - targetStartMs
      if (progress > 10 and elapsed < 500) or (wpm > 350) then
        return 'ERROR_CHEATING'
      end
    end

    -- 5. Progress Write
    redis.call('HSET', key, role .. '_progress', tostring(progress), role .. '_wpm', tostring(wpm), role .. '_last_active', tostring(nowMs))

    -- 6. Finish Line Logic
    local roleFinished = redis.call('HGET', key, role .. '_finished_ms')
    if state == 'IN_PROGRESS' and progress >= 100 and (not roleFinished or roleFinished == '0') then
      local field = role .. '_finished_ms'
      redis.call('HSET', key, field, tostring(nowMs))
      
      if not winnerId or winnerId == '' then
        redis.call('HSET', key, 'winner_id', userId)
        winnerId = userId
      end
    end

    -- Mutual Finish check
    local dataAfter = redis.call('HMGET', key, 'host_finished_ms', 'guest_finished_ms')
    local hf = tonumber(dataAfter[1] or '0')
    local gf = tonumber(dataAfter[2] or '0')
    
    if (hf > 0 and gf > 0) then
      if state ~= 'FINISHED' then
        redis.call('HSET', key, 'state', 'FINISHED')
        state = 'FINISHED'
      end
    end

    -- 7. Return Pulse Data
    local opponentData = redis.call('HMGET', key, opponentRole .. '_progress', opponentRole .. '_wpm', opponentRole .. '_finished_ms')
    local oppFinished = '0'
    if opponentData[3] and opponentData[3] ~= '' and opponentData[3] ~= '0' then oppFinished = '1' end
    
    return state .. ':' .. (winnerId or '') .. ':' .. (opponentData[1] or '0') .. ':' .. (opponentData[2] or '0') .. ':' .. tostring(targetStartMs) .. ':' .. (promptText or '') .. ':' .. oppFinished
  `
};




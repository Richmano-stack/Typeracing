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
  `
};



export const LUA_SCRIPTS = {
  // Ensures only one guest can join and state moves to LOBBY_FULL
  JOIN_ROOM: `
    local key = KEYS[1]
    local guestId = ARGV[1]
    local state = redis.call('HGET', key, 'state')
    local existingGuest = redis.call('HGET', key, 'guest_id')

    if state ~= 'WAITING_FOR_GUEST' then return 'ERROR_STATE' end
    if existingGuest and existingGuest ~= '' then return 'ERROR_FULL' end

    redis.call('HSET', key, 'guest_id', guestId, 'state', 'LOBBY_FULL')
    return 'OK'
  `,

  // Ensures only the first 'Finish' event triggers the DB persistence logic
  PERSIST_LOCK: `
    local key = KEYS[1]
    local alreadyPersisted = redis.call('HGET', key, 'persisted_to_db')
    if alreadyPersisted == '1' then return 0 end
    redis.call('HSET', key, 'persisted_to_db', '1')
    return 1
  `
};

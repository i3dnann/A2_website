local QBCore = exports['qb-core'] and exports['qb-core']:GetCoreObject() or nil

local function apiUrl(path)
  return (Config.ApiBaseUrl:gsub("/$", "")) .. path
end

local function headers()
  return {
    ["Content-Type"] = "application/json",
    ["X-A2-Token"] = Config.ApiToken
  }
end

local function postJson(path, payload, cb)
  PerformHttpRequest(apiUrl(path), function(status, body)
    if status < 200 or status >= 300 then
      print(("[a2_cityhub] POST %s failed: %s %s"):format(path, status, body or ""))
    end
    if cb then cb(status, body) end
  end, "POST", json.encode(payload or {}), headers())
end

local function getJson(path, cb)
  PerformHttpRequest(apiUrl(path), function(status, body)
    if status < 200 or status >= 300 then
      print(("[a2_cityhub] GET %s failed: %s %s"):format(path, status, body or ""))
      if cb then cb(status, nil) end
      return
    end
    local ok, data = pcall(json.decode, body or "{}")
    if cb then cb(status, ok and data or nil) end
  end, "GET", "", headers())
end

local function collectPlayers()
  local list = {}
  for _, source in ipairs(GetPlayers()) do
    local src = tonumber(source)
    local name = GetPlayerName(src) or ("Player " .. source)
    local player = QBCore and QBCore.Functions.GetPlayer(src) or nil
    list[#list + 1] = {
      source = src,
      name = name,
      citizenid = player and player.PlayerData and player.PlayerData.citizenid or nil,
      job = player and player.PlayerData and player.PlayerData.job and player.PlayerData.job.name or nil,
      gang = player and player.PlayerData and player.PlayerData.gang and player.PlayerData.gang.name or nil,
      duty = player and player.PlayerData and player.PlayerData.job and player.PlayerData.job.onduty or false,
      ping = GetPlayerPing(src)
    }
  end
  return list
end

local function sendStatus()
  local players = collectPlayers()
  postJson("/api/fivem/status", {
    serverName = Config.ServerName,
    players = #players,
    maxPlayers = GetConvarInt("sv_maxclients", 0),
    queue = 0,
    ping = 0,
    endpointStatus = "online",
    databaseStatus = "unknown",
    discordBotStatus = "unknown",
    websiteApiStatus = "online",
    playersList = players,
    onlinePlayers = players
  })
end

local function findPlayerByTarget(target)
  if not target then return nil end
  local numeric = tonumber(target)
  if numeric and GetPlayerName(numeric) then return numeric end
  for _, source in ipairs(GetPlayers()) do
    local src = tonumber(source)
    local player = QBCore and QBCore.Functions.GetPlayer(src) or nil
    if player and player.PlayerData and player.PlayerData.citizenid == target then return src end
    for _, identifier in ipairs(GetPlayerIdentifiers(src)) do
      if identifier == target then return src end
    end
  end
  return nil
end

local function sendActionResult(action, ok, message)
  postJson("/api/fivem/action-result", {
    actionId = action.id,
    actionType = action.actionType,
    target = action.target,
    ok = ok,
    message = message,
    time = os.date("!%Y-%m-%dT%H:%M:%SZ")
  })
end

local function handleAction(action)
  if not Config.EnableAdminActions then
    sendActionResult(action, false, "Admin actions are disabled in config.")
    return
  end

  if not Config.AllowedActions[action.actionType] then
    sendActionResult(action, false, "Action is not allowed by a2_cityhub config.")
    return
  end

  local target = findPlayerByTarget(action.target)
  if not target then
    sendActionResult(action, false, "Target player not found.")
    return
  end

  if action.actionType == "kick" then
    DropPlayer(target, action.reason or "Kicked by staff.")
    sendActionResult(action, true, "Player kicked.")
    return
  end

  TriggerClientEvent("a2_cityhub:client:action", target, action)
  sendActionResult(action, true, "Action sent to client.")
end

local function pollActions()
  if not Config.EnableAdminActions then return end
  getJson("/api/fivem/actions", function(_, data)
    if not data or not data.actions then return end
    for _, action in ipairs(data.actions) do
      handleAction(action)
    end
  end)
end

CreateThread(function()
  while true do
    if Config.EnablePlayerSync then sendStatus() end
    Wait(Config.SendStatusInterval)
  end
end)

CreateThread(function()
  while true do
    pollActions()
    Wait(Config.ActionPollInterval)
  end
end)

AddEventHandler("playerConnecting", function(name)
  postJson("/api/fivem/status", {
    event = "playerConnecting",
    playerName = name,
    players = #GetPlayers(),
    maxPlayers = GetConvarInt("sv_maxclients", 0)
  })
end)

AddEventHandler("playerDropped", function(reason)
  postJson("/api/fivem/status", {
    event = "playerDropped",
    playerName = GetPlayerName(source),
    reason = reason,
    players = #GetPlayers(),
    maxPlayers = GetConvarInt("sv_maxclients", 0)
  })
end)

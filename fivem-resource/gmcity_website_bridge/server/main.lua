local QBCore = nil

local function debugPrint(...)
    if Config.Debug then
        print('[gmcity_website_bridge]', ...)
    end
end

local function getCore()
    if QBCore then return QBCore end
    local ok, core = pcall(function()
        return exports[Config.CoreName]:GetCoreObject()
    end)
    if ok then QBCore = core end
    return QBCore
end

local function identifierMap(source)
    local identifiers = {
        steam = '',
        discord = '',
        license = '',
        fivem = ''
    }

    for _, identifier in ipairs(GetPlayerIdentifiers(source)) do
        local prefix, value = identifier:match('([^:]+):(.+)')
        if prefix and value and identifiers[prefix] ~= nil then
            identifiers[prefix] = value
        end
    end

    return identifiers
end

local function safeId(value)
    value = tostring(value or 'unknown')
    value = value:gsub('[^%w%-_]', '')
    if #value > 56 then value = value:sub(1, 56) end
    return value
end

local function characterName(playerData)
    local charinfo = playerData and playerData.charinfo or {}
    local first = charinfo.firstname or ''
    local last = charinfo.lastname or ''
    local full = (first .. ' ' .. last):gsub('^%s+', ''):gsub('%s+$', '')
    return full ~= '' and full or GetPlayerName(playerData.source or 0)
end

local function upsertLink(source)
    if not Config.WritePlayerLinks then return end

    local core = getCore()
    if not core then
        debugPrint('QBCore was not ready')
        return
    end

    local player = core.Functions.GetPlayer(source)
    if not player or not player.PlayerData then
        debugPrint('No QBCore player for source', source)
        return
    end

    local data = player.PlayerData
    local citizenid = data.citizenid or ''
    if citizenid == '' then
        debugPrint('No citizenid for source', source)
        return
    end

    local ids = identifierMap(source)
    local linkId = 'link-' .. safeId(citizenid)
    local userId = 'fivem-' .. safeId(ids.license ~= '' and ids.license or citizenid)
    local identifiersJson = json.encode(GetPlayerIdentifiers(source))

    exports.oxmysql:insert([[
        INSERT INTO player_links
            (id, user_id, steam_id, discord_id, license, fivem_id, citizenid, identifiers_json, verified_at, created_at, updated_at)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            steam_id = VALUES(steam_id),
            discord_id = VALUES(discord_id),
            license = VALUES(license),
            fivem_id = VALUES(fivem_id),
            identifiers_json = VALUES(identifiers_json),
            verified_at = NOW(),
            updated_at = NOW()
    ]], {
        linkId,
        userId,
        ids.steam,
        ids.discord,
        ids.license ~= '' and ('license:' .. ids.license) or '',
        ids.fivem,
        citizenid,
        identifiersJson
    }, function()
        debugPrint('Linked character', citizenid, characterName(data))
    end)
end

RegisterNetEvent('QBCore:Server:PlayerLoaded', function(player)
    local source = player and player.PlayerData and player.PlayerData.source or source
    if source then
        SetTimeout(1500, function()
            upsertLink(source)
        end)
    end
end)

AddEventHandler('playerJoining', function()
    local source = source
    SetTimeout(6000, function()
        upsertLink(source)
    end)
end)

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName ~= GetCurrentResourceName() then return end
    SetTimeout(2500, function()
        getCore()
        for _, source in ipairs(GetPlayers()) do
            upsertLink(tonumber(source))
        end
    end)
end)

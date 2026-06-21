local frozen = false

RegisterNetEvent("a2_cityhub:client:action", function(action)
  local ped = PlayerPedId()
  if not action or not action.actionType then return end

  if action.actionType == "heal" then
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
    ClearPedBloodDamage(ped)
    return
  end

  if action.actionType == "armor" then
    SetPedArmour(ped, tonumber(action.payload and action.payload.amount) or 100)
    return
  end

  if action.actionType == "kill" then
    SetEntityHealth(ped, 0)
    return
  end

  if action.actionType == "freeze" then
    frozen = true
    FreezeEntityPosition(ped, true)
    return
  end

  if action.actionType == "unfreeze" then
    frozen = false
    FreezeEntityPosition(ped, false)
  end
end)

CreateThread(function()
  while true do
    if frozen then
      DisableAllControlActions(0)
      EnableControlAction(0, 1, true)
      EnableControlAction(0, 2, true)
    end
    Wait(frozen and 0 or 750)
  end
end)

# FiveM Setup: a2_cityhub

## 1. Install Resource

Copy this folder:

```text
fivem-resource/a2_cityhub
```

into your FiveM server `resources` folder.

## 2. Configure

Edit:

```text
resources/a2_cityhub/config.lua
```

Set:

```lua
Config.ApiBaseUrl = "https://your-api-domain.com"
Config.ApiToken = "same-value-as-FIVEM_API_TOKEN"
Config.ServerName = "A2 Studio"
```

The token must match the backend `.env` value:

```text
FIVEM_API_TOKEN=CHANGE_ME_SECURE_TOKEN
```

## 3. Add to server.cfg

```text
ensure a2_cityhub
```

Make sure `qb-core` starts before `a2_cityhub`.

## 4. What It Sends

The resource sends:

- Server status heartbeat
- Player count and max players
- Online player summaries
- Player join/drop events
- Job/gang/duty fields when QBCore is available

## 5. Safe Web Actions

All actions flow:

```text
Frontend -> Backend permission check -> FiveM action queue -> a2_cityhub -> Database/audit/webhook log
```

By default, only safe actions in `Config.AllowedActions` are enabled:

- `heal`
- `armor`
- `freeze`
- `unfreeze`
- `kill`
- `kick`

In-game-only actions like spectate camera, noclip, bring/goto, and self-spawn should stay disabled or be implemented very carefully inside FiveM where an admin player source exists.

## 6. Health Check

Backend:

```text
https://your-api-domain.com/health
```

Public status page:

```text
https://your-frontend-domain.com/status
```

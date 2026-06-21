Config = {}

Config.ApiBaseUrl = "https://your-api-domain.com"
Config.ApiToken = "CHANGE_ME_SECURE_TOKEN"

Config.ServerName = "A2 Studio"
Config.SendStatusInterval = 30000
Config.ActionPollInterval = 5000

Config.EnableAdminActions = true
Config.EnableScreenshots = false
Config.EnableDutySync = true
Config.EnablePlayerSync = true

Config.AllowedActions = {
  heal = true,
  armor = true,
  freeze = true,
  unfreeze = true,
  kill = true,
  kick = true
}

using Newtonsoft.Json;
using UnityEngine;

public static class Utils
{
    public static ResourceType GetResourceTypeFromItemId(string resourceItemId)
    {
        // This is a placeholder implementation. In future verions, we would look this up from a database or a dictionary.
        switch (resourceItemId)
        {
            case "resource-grain":
                return ResourceType.Grain;
            case "resource-flour":
                return ResourceType.Flour;
            case "resource-bread":
                return ResourceType.Bread;
                default:
                return ResourceType.Unknown;
        }
    }

    public static NotificationConfig LoadNotificationConfig()
    {
        var configText = System.IO.File.ReadAllText("Assets/Scripts/Config/notification-config.json");
        return JsonConvert.DeserializeObject<NotificationConfig>(configText);
    }
}
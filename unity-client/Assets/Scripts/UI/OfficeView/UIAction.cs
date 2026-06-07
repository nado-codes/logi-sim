using System;
using Newtonsoft.Json;
using UnityEngine;

public class UIItemAction
{
    private NotificationConfig notificationConfig = Utils.LoadNotificationConfig();
    public string Name;
    public Action<string> Callback;

    public void Invoke(string itemId)
    {
        if(notificationConfig.logUINotifications.actions.Execute)
        {
            Debug.Log($"Invoking action {Name} on item {itemId}");
        }

        Callback?.Invoke(itemId);
    }
}
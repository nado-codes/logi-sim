using System.Collections.Generic;
using System.Linq;
using System;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(UIActionController))]
public class PopupView : BaseWindow<PopupView>
{
    private UIActionController actionController;
    
    private GameObject closeButton;

    protected override void Awake()
    {
        base.Awake();

       var windowBase = transform.Find("WindowBase");
       var windowTop = windowBase?.Find("WindowTop");
       closeButton = windowTop?.Find("btnClose")?.gameObject;

       if(closeButton == null)
       {
           Debug.LogError("PopupView: Close button not found in children. Make sure there is a GameObject named 'btnClose' under 'WindowBase/WindowTop'");
       }
    }

    public bool Setup(string title, string message, List<UIItemAction> actions, bool hideCloseButton = false)
    {
        var texts = GetComponentsInChildren<TextMeshProUGUI>();
        var txTitle = texts.FirstOrDefault(t => t.name == "txWindowTitle");
        var messageText = texts.FirstOrDefault(t => t.name == "txPromptBody");
        var promptComponent = GetComponent<PopupView>();

        if(txTitle == null || messageText == null)
        {
            Debug.LogError("Prompt prototype must have a TextMeshProUGUI called txWindowTitle and txPromptBody");
            return false;
        }
        if(promptComponent == null)
        {
            Debug.LogError("Prompt prototype must have a Prompt component");
            return false;
        }

        actionController = GetComponent<UIActionController>();
        if(actionController == null)
        {
            Debug.LogError("Prompt prototype must have a UIActionController component");
            return false;
        }
        actionController.LoadActions(actions.Select(a =>
        {
            var action = new UIItemAction
            {
                Name = a.Name,
                Callback = (itemId) =>
                {
                    a.Callback?.Invoke(itemId);
                    Close();
                }
            };
            return action;
        }));

        if(hideCloseButton && closeButton != null)
        {
            Destroy(closeButton.gameObject);
        }

        txTitle.text = title;
        messageText.text = message;

        return Open();
    }
}
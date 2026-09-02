using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(UIActionController))]
public class PromptView : BaseWindow<PromptView>
{
    private UIActionController actionController;

    protected override void Start()
    {
        base.Start();
    }

    public void Setup(string title, string message, List<UIItemAction> actions)
    {
        var texts = GetComponentsInChildren<TextMeshProUGUI>();
        var txTitle = texts.FirstOrDefault(t => t.name == "txWindowTitle");
        var messageText = texts.FirstOrDefault(t => t.name == "txPromptBody");
        var promptComponent = GetComponent<PromptView>();

        if(txTitle == null || messageText == null)
        {
            Debug.LogError("Prompt prototype must have a TextMeshProUGUI called txWindowTitle and txPromptBody");
            return;
        }
        if(promptComponent == null)
        {
            Debug.LogError("Prompt prototype must have a Prompt component");
            return;
        }

        actionController = GetComponent<UIActionController>();
        if(actionController == null)
        {
            Debug.LogError("Prompt prototype must have a UIActionController component");
            return;
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

        txTitle.text = title;
        messageText.text = message;
    }

    public override void Close()
    {
        base.Close();
        PromptController.CloseActivePrompt();
    }
}
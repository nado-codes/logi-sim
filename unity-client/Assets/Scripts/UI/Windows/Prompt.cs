using TMPro;
using UnityEngine;
using System.Linq;
using System.Collections.Generic;

[RequireComponent(typeof(UIActionController))]
public class Prompt : BaseWindow<Prompt>
{
    private static Prompt Instance;
    private UIActionController actionController;

    public GameObject promptPrototype;

    protected override void Start()
    {
        base.Start();

        actionController = GetComponent<UIActionController>();

        if(Instance == null)
        {
            Instance = this;
            Close();
        } 
    }

    public static void Show(string title, string message)
    {
        if(Instance == null)
        {
            Debug.LogError("Prompt instance is null. Make sure there is a Prompt component in the scene");
            return;
        }
        if(Instance.promptPrototype == null)
        {
            Debug.LogError("Prompt prototype is null. Make sure the Prompt component has a promptPrototype set");
            return;
        }

        var prompt = Instantiate(Instance.promptPrototype);
        prompt.transform.SetParent(Instance.transform.parent, false);
        var texts = prompt.GetComponentsInChildren<TextMeshProUGUI>();
        var txTitle = texts.FirstOrDefault(t => t.name == "txWindowTitle");
        var messageText = texts.FirstOrDefault(t => t.name == "txPromptBody");
        var promptComponent = prompt.GetComponent<Prompt>();

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

        var actionController = promptComponent.GetComponent<UIActionController>();
        if(actionController == null)
        {
            Debug.LogError("Prompt prototype must have a UIActionController component");
            return;
        }
        actionController.ActionButtonPrototype = Instance.actionController.ActionButtonPrototype;

        var debtResolutionWindow = FindObjectsByType<DebtResolutionWindow>(FindObjectsSortMode.None).FirstOrDefault();
        if(debtResolutionWindow == null)
        {
            Debug.LogError("Could not find DebtResolutionWindow in scene. Make sure there is a DebtResolutionWindow component in the scene");
            return;
        }

        actionController.LoadActions(new List<UIItemAction>() { 
            new UIItemAction{ Name = "Open Debt Resolution Screen", Callback = (itemId) => {
                debtResolutionWindow.Open();
                Destroy(prompt);
            }
        }});

        txTitle.text = title;
        messageText.text = message;
        prompt.GetComponent<CanvasGroupToggle>().Show();
    }

}
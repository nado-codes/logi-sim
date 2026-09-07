using TMPro;
using UnityEngine;
using System.Linq;
using System.Collections.Generic;
using System;

public class PopupController : MonoBehaviour 
{
    private static PopupController Instance;

    public PopupView promptPrototype;
    public UIFader fader;

    private static PopupView activePrompt;

    void Awake()
    {
        if(Instance == null)
        {
            Instance = this;
            promptPrototype.GetComponent<CanvasGroupToggle>().Hide();
        }

        if(fader == null)
        {
            Debug.LogError("Prompt: UIFader component is not assigned!");
            throw new Exception("Prompt: UIFader component is not assigned!");
        }
    }

    private static PopupView showPopup(string title, string message, List<UIItemAction> actions = null, bool isPrompt = false)
    {
        if(Instance == null)
        {
            Debug.LogError("Prompt instance is null. Make sure there is a Prompt component in the scene");
            throw new Exception("Prompt instance is null. Make sure there is a Prompt component in the scene");
        }
        if(Instance.promptPrototype == null)
        {
            Debug.LogError("Prompt prototype is null. Make sure the Prompt component has a promptPrototype set");
            throw new Exception("Prompt prototype is null. Make sure the Prompt component has a promptPrototype set");
        }

        var prompt = Instantiate(Instance.promptPrototype.gameObject);
        prompt.transform.SetParent(Instance.transform.parent, false);
        prompt.name = "Prompt_" + title;

        var popupComponent = prompt.GetComponent<PopupView>();

        if(popupComponent == null)
        {
            Debug.LogError("Prompt prototype must have a Popup component");
            throw new Exception("Prompt prototype must have a Popup component");
        }

        var didOpen = popupComponent.Setup(title, message, actions?? new List<UIItemAction>() {
            new UIItemAction{ Name = "Ok" }
        },isPrompt);

        if(!didOpen)
        {
            Debug.LogWarning($"PopupController: {prompt.name} failed to open (Setup() returned false). Destroying instantiated popup.");
            Destroy(prompt);
            return null;
        }

        return popupComponent;
    }

    public static void ShowPrompt(string title, string message, List<UIItemAction> actions = null)
    {
        if(activePrompt != null)
        {
            return;
        }

        var popupComponent = showPopup(title, message, actions,false);

        if(popupComponent == null)
        {
            return;
        }

        activePrompt = popupComponent;

        activePrompt.OnClose = () =>
        {
            activePrompt = null;
            Instance.fader.Deactivate();
        };

        Instance.fader.Activate();
    }

    public static void ShowPopup(string title, string message, List<UIItemAction> actions = null)
    {
        showPopup(title, message, actions,true);
    }

    

}
using TMPro;
using UnityEngine;
using System.Linq;
using System.Collections.Generic;

public class PromptController : MonoBehaviour 
{
    private static PromptController Instance;

    public PopupView promptPrototype;
    public UIFader fader;

    private static PopupView activePrompt;

    void Start()
    {
        if(Instance == null)
        {
            Instance = this;
            promptPrototype.GetComponent<CanvasGroupToggle>().Hide();
        }

        if(fader == null)
        {
            Debug.LogError("Prompt: UIFader component is not assigned!");
            throw new System.Exception("Prompt: UIFader component is not assigned!");
        }
    }

    public static void ShowPrompt(string title, string message, List<UIItemAction> actions = null)
    {
        if(activePrompt != null)
        {
            return;
        }
        
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

        var prompt = Instantiate(Instance.promptPrototype.gameObject);
        prompt.transform.SetParent(Instance.transform.parent, false);
        prompt.name = "Prompt_" + title;

        var popupComponent = prompt.GetComponent<PopupView>();

        if(popupComponent == null)
        {
            Debug.LogError("Prompt prototype must have a Popup component");
            return;
        }

        var debtResolutionWindow = FindObjectsByType<DebtServicingWindow>(FindObjectsSortMode.None).FirstOrDefault();
        if(debtResolutionWindow == null)
        {
            Debug.LogError("Could not find DebtServicingWindow in scene. Make sure there is a DebtServicingWindow component in the scene");
            return;
        }

        popupComponent.Setup(title, message, actions?? new List<UIItemAction>() { 
            new UIItemAction{ Name = "Ok", Callback = (itemId) => {
                CloseActivePrompt();
            }
        }});

        popupComponent.Open();
        
        Instance.fader.Activate();
        activePrompt = popupComponent;
    }

    public static void CloseActivePrompt()
    {
        if(activePrompt != null)
        {
            Destroy(activePrompt.gameObject);
        }
        activePrompt = null;
        Instance.fader.Deactivate();
    }

}
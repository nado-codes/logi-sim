using TMPro;
using UnityEngine;
using System.Linq;
using System.Collections.Generic;

public class PromptController : MonoBehaviour 
{
    private static PromptController Instance;

    public PromptView promptPrototype;
    public UIFader fader;

    private static PromptView activePrompt;

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

        var promptComponent = prompt.GetComponent<PromptView>();

        if(promptComponent == null)
        {
            Debug.LogError("Prompt prototype must have a Prompt component");
            return;
        }

        var debtResolutionWindow = FindObjectsByType<DebtResolutionWindow>(FindObjectsSortMode.None).FirstOrDefault();
        if(debtResolutionWindow == null)
        {
            Debug.LogError("Could not find DebtResolutionWindow in scene. Make sure there is a DebtResolutionWindow component in the scene");
            return;
        }

        promptComponent.Setup(title, message, actions?? new List<UIItemAction>() { 
            new UIItemAction{ Name = "Ok", Callback = (itemId) => {
                promptComponent.Close();
            }
        }});

        promptComponent.Open();
        
        Instance.fader.Activate();
        activePrompt = promptComponent;
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
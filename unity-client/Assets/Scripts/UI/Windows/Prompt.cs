using TMPro;
using UnityEngine;
using System.Linq;

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
            Debug.Log("SETTING INSTANCE");
            Instance = this;
            Show("Welcome To LogiSim!", "Your adventure begins~");
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

        txTitle.text = title;
        messageText.text = message;
    }

}
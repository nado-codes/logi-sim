using UnityEngine;

public class PromptWindow : BaseWindow<PromptWindow>
{
    protected override void Start()
    {
        base.Start();
        Close();
    }

    public void Open(string title, string message, UIItemAction confirmAction, UIItemAction cancelAction)
    {
        Open();
    }

    public new void Close()
    {
        base.Close();
    }
}

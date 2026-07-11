using UnityEngine;

[RequireComponent(typeof(CanvasGroupToggle))]
public class BaseWindow<T> : MonoBehaviour
{
    protected CanvasGroupToggle canvasGroupToggle {get; private set;}

    protected virtual void Start()
    {
        canvasGroupToggle = GetComponent<CanvasGroupToggle>();
    }

    public void Open()
    {
        canvasGroupToggle.Show();
    }

    public void Close()
    {
       canvasGroupToggle.Hide();
    }
}

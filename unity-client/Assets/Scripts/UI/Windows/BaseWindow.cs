using UnityEngine;

[RequireComponent(typeof(CanvasGroupToggle))]
public class BaseWindow<T> : MonoBehaviour
{
    protected CanvasGroupToggle canvasGroupToggle {get; private set;}

    [SerializeField] private bool startOpen = false;

    protected virtual void Start()
    {
        canvasGroupToggle = GetComponent<CanvasGroupToggle>();

        if(!startOpen)
        {
            Close();
        }
        
    }

    void Awake()
    {
        canvasGroupToggle = GetComponent<CanvasGroupToggle>();
    }

    public void Open()
    {
        canvasGroupToggle.Show();
    }

    public virtual void Close()
    {
        Debug.Log("closing window: " + gameObject.name);
       canvasGroupToggle.Hide();
    }
}

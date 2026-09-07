using UnityEngine;
using System;

[RequireComponent(typeof(CanvasGroupToggle))]
public class BaseWindow<T> : MonoBehaviour
{
    public Action OnClose { get; set; }
    protected CanvasGroupToggle canvasGroupToggle {get; private set;}

    [SerializeField] private bool startOpen = false;

    protected virtual void Start()
    {
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
        if (canvasGroupToggle == null)
        {
            Debug.LogWarning($"CanvasGroupToggle not yet initialised on {gameObject.name}. Open() called before Start().");
            return;
        }
        canvasGroupToggle.Show();
    }

    public virtual void Close()
    {
        if (canvasGroupToggle == null)
        {
            Debug.LogWarning($"CanvasGroupToggle not yet initialised on {gameObject.name}. Open() called before Start().");
            return;
        }
        canvasGroupToggle.Hide();
        OnClose?.Invoke();
    }
}

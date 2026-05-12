using TMPro;
using UnityEngine;

public class BaseWindow<T> : MonoBehaviour
{
    private static BaseWindow<T> _instance;
    public bool IsOpen = false;

    protected virtual void Start()
    {
        _instance = this;
    }

    public void Open()
    {
        _instance.gameObject.SetActive(true);
        IsOpen = true;
    }

    public void Close()
    {
        _instance.gameObject.SetActive(false);
        IsOpen = false;
    }
}

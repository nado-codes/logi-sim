using TMPro;
using UnityEngine;

public class BaseWindow<T> : MonoBehaviour
{
    private static BaseWindow<T> _instance;
    protected bool isOpen = false;

    protected virtual void Start()
    {
        _instance = this;
    }

    public void Open()
    {
        _instance.gameObject.SetActive(true);
        isOpen = true;
    }

    public void Close()
    {
        _instance.gameObject.SetActive(false);
        isOpen = false;
    }
}

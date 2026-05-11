using UnityEngine;

public class BaseWindow<T> : MonoBehaviour
{
    private static BaseWindow<T> _instance;
    public bool IsOpen = false;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    protected virtual void Start()
    {
        _instance = this;
    }

    // Update is called once per frame
    void Update()
    {
        
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

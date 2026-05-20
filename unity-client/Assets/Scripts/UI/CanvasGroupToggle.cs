using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class CanvasGroupToggle : MonoBehaviour
{
    private CanvasGroup canvasGroup;
    public bool IsVisible { get; private set; } = true;

    void Awake()
    {
        canvasGroup = GetComponent<CanvasGroup>();
    }

    public void Show()
    {
        canvasGroup.alpha = 1;
        canvasGroup.blocksRaycasts = true;
        canvasGroup.interactable = true;
        IsVisible = true;
    }

    public void Hide()
    {
        canvasGroup.alpha = 0;
        canvasGroup.blocksRaycasts = false;
        canvasGroup.interactable = false;
        IsVisible = false;
    }
}
using UnityEngine;

[RequireComponent(typeof (CanvasGroup))]
public class UIFader : MonoBehaviour
{
    public enum FaderState
    {
        Inactive,
        Active,
    }

    public float FadeSpeed = 5.0f;
    public float MaxOpacityAlpha = 0.9f;
    private FaderState faderState = FaderState.Inactive;

    private CanvasGroup canvasGroup;

    void Start()
    {
        canvasGroup = GetComponent<CanvasGroup>();
        canvasGroup.alpha = 0;
    }

    void Update()
    {
        if(faderState == FaderState.Active)
        {
            canvasGroup.alpha = Mathf.MoveTowards(canvasGroup.alpha, MaxOpacityAlpha, Time.deltaTime * FadeSpeed);
        }
        else
        {
            canvasGroup.alpha = Mathf.MoveTowards(canvasGroup.alpha, 0, Time.deltaTime * FadeSpeed);
        }
    }

    public void Activate() 
    {
        faderState = FaderState.Active;
        canvasGroup.blocksRaycasts = true;
    }

    public void Deactivate() 
    {
        faderState = FaderState.Inactive;
        canvasGroup.blocksRaycasts = false;
    }
}

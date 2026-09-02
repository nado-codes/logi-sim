using System;
using UnityEngine;

[RequireComponent(typeof (CanvasGroup))]
public class RegulatoryActionIndicator : MonoBehaviour
{
    public enum IndicatorState
    {
        Off,
        On,
        Blinking
    }
    private CanvasGroup canvasGroup;
    public float BlinkSpeed = 0.5f;

    private IndicatorState indicatorState = IndicatorState.Off;

    void Start()
    {
        canvasGroup = GetComponent<CanvasGroup>();
        Blink();
    }
    void Update()
    {
        if(indicatorState == IndicatorState.Blinking)
        {
            canvasGroup.alpha -= BlinkSpeed *Time.deltaTime;

            if(canvasGroup.alpha <= 0.5)
            {
                canvasGroup.alpha = 1;
            }
        }
        else
        {
            canvasGroup.alpha = Mathf.MoveTowards(canvasGroup.alpha, indicatorState == IndicatorState.On ? 1 : .5f, Time.deltaTime * BlinkSpeed);
        }
    }

    public void Blink()
    {
        indicatorState = IndicatorState.Blinking;
    }

    public void StopBlinking()
    {
        indicatorState = IndicatorState.Off;
    }

    public void TurnOn()
    {
        StopBlinking();
        indicatorState = IndicatorState.On;
    }

    public void TurnOff()
    {
        StopBlinking();
        indicatorState = IndicatorState.Off;
    }
}
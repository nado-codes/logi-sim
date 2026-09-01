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
    private CanvasGroup cgToggle;
    public float BlinkSpeed = 0.5f;

    private IndicatorState indicatorState = IndicatorState.Off;

    void Start()
    {
        cgToggle = GetComponent<CanvasGroup>();
        Blink();
    }
    void Update()
    {
        if(indicatorState == IndicatorState.Blinking)
        {
            cgToggle.alpha -= BlinkSpeed *Time.deltaTime;

            if(cgToggle.alpha <= 0.5)
            {
                cgToggle.alpha = 1;
            }
        }
        else
        {
            cgToggle.alpha = Mathf.MoveTowards(cgToggle.alpha, indicatorState == IndicatorState.On ? 1 : .5f, Time.deltaTime * BlinkSpeed);
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
using System;
using UnityEngine;

[RequireComponent(typeof (CanvasGroup))]
public class RegulatoryActionIndicator : MonoBehaviour
{
    private CanvasGroup cgToggle;
    private float counter;
    public float BlinkSpeed = 1;
    public float BlinkOffset = 0;

    void Start()
    {
        cgToggle = GetComponent<CanvasGroup>();
    }
    void Update()
    {
        counter += BlinkSpeed * Time.deltaTime;
        cgToggle.alpha = ((float)Math.Sin(counter)+2)/1+BlinkOffset;
    }
}
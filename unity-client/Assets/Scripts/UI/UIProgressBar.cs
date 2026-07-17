using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class UIProgressBar : MonoBehaviour
{
    private RectTransform foregroundTransform;
    private RectTransform backgroundTransform;
    private TextMeshProUGUI label;

    private float currentProgress = 0f;
    private float targetProgress = 0f;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        foregroundTransform = transform.Find("prg_fg").GetComponent<RectTransform>();
        backgroundTransform = transform.Find("prg_bg").GetComponent<RectTransform>();
        label = transform.Find("prg_label").GetComponent<TextMeshProUGUI>();

        if(foregroundTransform == null)
        {
            Debug.LogError("UIProgressBar: Could not find 'prg_fg' RectTransform");
        }

        if(backgroundTransform == null)
        {
            Debug.LogError("UIProgressBar: Could not find 'prg_bg' RectTransform");
        }

        if(label == null)
        {
            Debug.LogError("UIProgressBar: Could not find 'prg_label' Text.");
        }
    }

    void Update()
    {
        if(foregroundTransform != null)
        {
            currentProgress = Mathf.MoveTowards(currentProgress, targetProgress, Time.deltaTime * .25f);

            // Get the width of the background to calculate the offset for the foreground
            float referenceWidth = backgroundTransform.GetComponent<RectTransform>().rect.width;
            float rightOffset = (1f - currentProgress) * referenceWidth;

            // offsetMax.x is negative of "Right" in inspector
            foregroundTransform.offsetMax = new Vector2(-rightOffset, foregroundTransform.offsetMax.y);
        }
    }

    public void SetLabel(string text)
    {
        if(label != null)
        {
            label.text = text;
        }
    }

    public void SetProgress(float progress)
    {
        targetProgress = progress;
    }
}

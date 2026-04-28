using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class RecBlink : MonoBehaviour
{
    Image image;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        image = GetComponent<Image>();
        StartCoroutine(ToggleBlink(.5f)); // Call ToggleBlink every 0.5 seconds
    }

    IEnumerator ToggleBlink(float interval)
    {
        while (true)
        {
            image.enabled = !image.enabled; // Toggle the enabled state of the Image component

            yield return new WaitForSeconds(interval);
            Debug.Log("Task executed every " + interval + " seconds");
        }
    }
}

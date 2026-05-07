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
        StartCoroutine(ToggleBlink(.5f)); 
    }

    IEnumerator ToggleBlink(float interval)
    {
        while (true)
        {
            image.enabled = !image.enabled; 

            yield return new WaitForSeconds(interval);
        }
    }
}

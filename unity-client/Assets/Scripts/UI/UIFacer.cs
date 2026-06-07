using UnityEngine;

public class UIFacer : MonoBehaviour
{
    void Update()
    {
        if(Camera.main == null)
        {
            Debug.LogError("UIFacer requires a Camera tagged as MainCamera.");
            return;
        }

        transform.LookAt(transform.position + Camera.main.transform.rotation * Vector3.forward, Camera.main.transform.rotation * Vector3.up);

        transform.localScale = Vector3.one * Mathf.Max(0.05f,0.05f * (Vector3.Distance(Camera.main.transform.position, transform.position) / 50));
    }
}

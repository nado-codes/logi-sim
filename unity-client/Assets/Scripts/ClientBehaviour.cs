using System.Collections;
using UnityEngine;
using UnityEngine.Networking;



public class ClientBehaviour : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        StartCoroutine(FetchWorldState());
    }

    IEnumerator FetchWorldState()
    {
        /*
            app.get("/api/world/trucks", (req, res) => {
                res.send(world.getTrucks());
            });

            app.get("/api/world/locations", (req, res) => {
              res.send(world.getLocations());
            });
        */
        var trucksRequest = UnityWebRequest.Get("http://localhost:3001/api/world/trucks");
        yield return trucksRequest.SendWebRequest();
        var locationsRequest = UnityWebRequest.Get("http://localhost:3001/api/world/locations");
        yield return locationsRequest.SendWebRequest();

        if (trucksRequest.result == UnityWebRequest.Result.Success && locationsRequest.result == UnityWebRequest.Result.Success)
        {
            Debug.Log(trucksRequest.downloadHandler.text);
            Debug.Log(locationsRequest.downloadHandler.text);
            // parse JSON and spawn cubes here
        }
        else
        {
            Debug.LogError("Failed to fetch world state: " + trucksRequest.error);
        }
    }

    // Update is called once per frame
    void Update()
    {

    }
}

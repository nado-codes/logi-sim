using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;



public class Client : MonoBehaviour
{
    public List<TruckDTO> truckDTOs = new List<TruckDTO>();
    public List<LocationDTO> locationDTOs = new List<LocationDTO>();

    public GameObject boxTruckProto, flatbedTruckProto;
    public GameObject processorProto, bakeryProto;
    public GameObject farmProto;
    public GameObject townProto;

    private static Client _client;
    public static Client Instance
    {
        get
        {
            return _client;
        }
    }

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        _client = this;
        RefreshWorldState();
    }

    public void RefreshWorldState()
    {
        StartCoroutine(FetchWorldState());
    }

    private IEnumerator FetchWorldState()
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
            foreach(TruckDTO truck in truckDTOs)
            {
                Destroy(truck.gameObject);
            }

            truckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);
            Debug.Log("There are "+truckDTOs.Count+" trucks to spawn");

            foreach(TruckDTO truck in truckDTOs)
            {
                var newTruck = Instantiate(boxTruckProto,truck.position,Quaternion.identity);
                truck.gameObject = newTruck.gameObject;
            }

            locationDTOs = JsonConvert.DeserializeObject<List<LocationDTO>>(locationsRequest.downloadHandler.text);
            Debug.Log("There are "+locationDTOs.Count+" locations to spawn");


            foreach(LocationDTO location in locationDTOs)
            {
                if(location.locationType == LocationType.Producer)
                {
                    var newFarm = Instantiate(farmProto,location.position,Quaternion.identity);
                }
                else if (location.locationType == LocationType.Processor)
                {
                    if(location.name.ToLower().Contains("bakery"))
                    {
                        var newBakery = Instantiate(bakeryProto,location.position,Quaternion.identity);
                    }
                    else
                    {
                        var newFactory = Instantiate(processorProto,location.position,Quaternion.identity);
                    }
                }
                else if(location.locationType == LocationType.Town)
                {
                    var newTown = Instantiate(townProto,location.position,Quaternion.identity);
                }
            }
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

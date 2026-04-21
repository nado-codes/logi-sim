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
        StartCoroutine(FetchLocationState());
        StartCoroutine(FetchTruckState());
        StartCoroutine(RefreshTrucks(.4f));
    }

    IEnumerator RefreshTrucks(float interval)
    {
        while (true)
        {
            var trucksRequest = UnityWebRequest.Get("http://localhost:3001/api/world/trucks");
            yield return trucksRequest.SendWebRequest();

            if (trucksRequest.result == UnityWebRequest.Result.Success)
            {
                var updatedTruckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);
                foreach (TruckDTO truckDTO in updatedTruckDTOs)
                {
                    var existingTruckDTO = truckDTOs.Find(truck => truck.id == truckDTO.id);
                    if (existingTruckDTO != null)
                    {
                        existingTruckDTO.position = truckDTO.position;
                        existingTruckDTO.destinationId = truckDTO.destinationId;
                    }

                }
            }

            yield return new WaitForSeconds(interval);
            Debug.Log("Task executed every " + interval + " seconds");
        }
    }

    const float positionScaleFactor = 5f;

    private IEnumerator FetchTruckState()
    {
        var trucksRequest = UnityWebRequest.Get("http://localhost:3001/api/world/trucks");
        yield return trucksRequest.SendWebRequest();

        if (trucksRequest.result == UnityWebRequest.Result.Success)
        {
            foreach (TruckDTO truck in truckDTOs)
            {
                Destroy(truck.gameObject);
            }

            truckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);
            Debug.Log("There are " + truckDTOs.Count + " trucks to spawn");

            foreach (TruckDTO truck in truckDTOs)
            {
                var newTruck = Instantiate(boxTruckProto, truck.position, Quaternion.identity);
                truck.gameObject = newTruck.gameObject;
                truck.gameObject.transform.position *= positionScaleFactor;
            }
        }
        else
        {
            Debug.LogError("Failed to fetch truck state: " + trucksRequest.error);
        }
    }

    private IEnumerator FetchLocationState()
    {
        var locationsRequest = UnityWebRequest.Get("http://localhost:3001/api/world/locations");
        yield return locationsRequest.SendWebRequest();

        if (locationsRequest.result == UnityWebRequest.Result.Success)
        {
            locationDTOs = JsonConvert.DeserializeObject<List<LocationDTO>>(locationsRequest.downloadHandler.text);
            Debug.Log("There are " + locationDTOs.Count + " locations to spawn");


            foreach (LocationDTO location in locationDTOs)
            {
                if (location.locationType == LocationType.Producer)
                {
                    var newFarm = Instantiate(farmProto, location.position, Quaternion.identity);
                    location.gameObject = newFarm.gameObject;
                }
                else if (location.locationType == LocationType.Processor)
                {
                    if (location.name.ToLower().Contains("bakery"))
                    {
                        var newBakery = Instantiate(bakeryProto, location.position, Quaternion.identity);
                        location.gameObject = newBakery.gameObject;
                    }
                    else
                    {
                        var newFactory = Instantiate(processorProto, location.position, Quaternion.identity);
                        location.gameObject = newFactory.gameObject;
                    }
                }
                else if (location.locationType == LocationType.Town)
                {
                    var newTown = Instantiate(townProto, location.position, Quaternion.identity);
                    location.gameObject = newTown.gameObject;
                }
                location.gameObject.transform.position *= positionScaleFactor;
            }
        }
        else
        {
            Debug.LogError("Failed to fetch world state: " + locationsRequest.error);
        }
    }

    // Update is called once per frame
    void Update()
    {
        foreach (TruckDTO truck in truckDTOs)
        {
            if (truck.gameObject != null)
            {
                truck.gameObject.transform.position = Vector3.Lerp(truck.gameObject.transform.position, truck.position * positionScaleFactor, Time.deltaTime);

                var truckDestination = locationDTOs.Find(location => location.id == truck.destinationId);

                if (truckDestination != null)
                {
                    var dirToDestination = truckDestination.position - truck.position;
                    truck.gameObject.transform.rotation = Quaternion.Lerp(truck.gameObject.transform.rotation, Quaternion.LookRotation(dirToDestination), Time.deltaTime * 5f);
                }
            }
        }
    }
}

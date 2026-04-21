using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;



public class Client : MonoBehaviour
{
    private const string BaseUrl = "http://localhost:3001/api";
    public List<TruckDTO> truckDTOs = new List<TruckDTO>();
    public List<LocationDTO> locationDTOs = new List<LocationDTO>();
    public List<CompanyDTO> companyDTOs = new List<CompanyDTO>();

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

    void Start()
    {
        _client = this;
        StartCoroutine(FetchLocationState());
        StartCoroutine(FetchCompanyState());
        StartCoroutine(FetchTruckState());

        StartCoroutine(RefreshTrucks(.4f));
    }

    IEnumerator RefreshTrucks(float interval)
    {
        while (true)
        {
            var trucksRequest = UnityWebRequest.Get(BaseUrl + "/world/trucks");
            yield return trucksRequest.SendWebRequest();

            if (trucksRequest.result == UnityWebRequest.Result.Success)
            {
                var updatedTruckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);
                foreach (TruckDTO truckDTO in updatedTruckDTOs)
                {
                    var existingTruckDTO = truckDTOs.Find(truck => truck.Id == truckDTO.Id);
                    if (existingTruckDTO != null)
                    {
                        existingTruckDTO.Position = truckDTO.Position;
                        existingTruckDTO.DestinationId = truckDTO.DestinationId;
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
        var trucksRequest = UnityWebRequest.Get(BaseUrl + "/world/trucks");
        yield return trucksRequest.SendWebRequest();

        if (trucksRequest.result == UnityWebRequest.Result.Success)
        {
            foreach (TruckDTO truck in truckDTOs)
            {
                Destroy(truck.GameObject);
            }

            truckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);
            Debug.Log("There are " + truckDTOs.Count + " trucks to spawn");

            foreach (TruckDTO truck in truckDTOs)
            {
                var newTruck = Instantiate(boxTruckProto, truck.Position, Quaternion.identity);
                truck.GameObject = newTruck.gameObject;
                truck.GameObject.transform.position *= positionScaleFactor;
            }
        }
        else
        {
            Debug.LogError("Failed to fetch truck state: " + trucksRequest.error);
        }
    }

    private IEnumerator FetchLocationState()
    {
        var locationsRequest = UnityWebRequest.Get(BaseUrl + "/world/locations");
        yield return locationsRequest.SendWebRequest();

        if (locationsRequest.result == UnityWebRequest.Result.Success)
        {
            locationDTOs = JsonConvert.DeserializeObject<List<LocationDTO>>(locationsRequest.downloadHandler.text);
            Debug.Log("There are " + locationDTOs.Count + " locations to spawn");


            foreach (LocationDTO location in locationDTOs)
            {
                if (location.locationType == LocationType.Producer)
                {
                    var newFarm = Instantiate(farmProto, location.Position, Quaternion.identity);
                    location.GameObject = newFarm.gameObject;
                }
                else if (location.locationType == LocationType.Processor)
                {
                    if (location.Name.ToLower().Contains("bakery"))
                    {
                        var newBakery = Instantiate(bakeryProto, location.Position, Quaternion.identity);
                        location.GameObject = newBakery.gameObject;
                    }
                    else
                    {
                        var newFactory = Instantiate(processorProto, location.Position, Quaternion.identity);
                        location.GameObject = newFactory.gameObject;
                    }
                }
                else if (location.locationType == LocationType.Town)
                {
                    var newTown = Instantiate(townProto, location.Position, Quaternion.identity);
                    location.GameObject = newTown.gameObject;
                }
                location.GameObject.transform.position *= positionScaleFactor;
            }
        }
        else
        {
            Debug.LogError("Failed to fetch world state: " + locationsRequest.error);
        }
    }

    private IEnumerator FetchCompanyState()
    {
        var companiesRequest = UnityWebRequest.Get(BaseUrl + "/companies");
        yield return companiesRequest.SendWebRequest();

        if (companiesRequest.result == UnityWebRequest.Result.Success)
        {
            companyDTOs = JsonConvert.DeserializeObject<List<CompanyDTO>>(companiesRequest.downloadHandler.text);
            Debug.Log("There are " + companyDTOs.Count + " companies");
        }
        else
        {
            Debug.LogError("Failed to fetch company state: " + companiesRequest.error);
        }
    }

    // Update is called once per frame
    void Update()
    {
        foreach (TruckDTO truck in truckDTOs)
        {
            if (truck.GameObject != null)
            {
                truck.GameObject.transform.position = Vector3.Lerp(truck.GameObject.transform.position, truck.Position * positionScaleFactor, Time.deltaTime);

                var truckDestination = locationDTOs.Find(location => location.Id == truck.DestinationId);

                if (truckDestination != null)
                {
                    var dirToDestination = truckDestination.Position - truck.Position;

                    if (dirToDestination != Vector3.zero)
                    {
                        truck.GameObject.transform.rotation = Quaternion.Lerp(truck.GameObject.transform.rotation, Quaternion.LookRotation(dirToDestination), Time.deltaTime * 5f);
                    }
                }
            }
        }
    }
}

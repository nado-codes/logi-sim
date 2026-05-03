using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEditor.PackageManager;
using UnityEngine;
using UnityEngine.Networking;


public class Client : MonoBehaviour
{
    private const string BaseUrl = "http://localhost:3001/api";
    public static List<TruckDTO> TruckDTOs = new List<TruckDTO>();
    public static List<LocationDTO> LocationDTOs = new List<LocationDTO>();
    public static List<CompanyDTO> CompanyDTOs = new List<CompanyDTO>();
    public static int WorldTick = 0;

    public GameObject boxTruckProto, flatbedTruckProto;
    public GameObject processorProto, bakeryProto;
    public GameObject farmProto;
    public GameObject townProto;
    public bool SpawnEntities = false;

    private static Client _client;
    public static Client Instance
    {
        get
        {
            return _client;
        }
    }

    enum APICallType
    {
        Get,
        Post
    }

    void Awake()
    {
        DontDestroyOnLoad(gameObject);
    } 

    void Start()
    {
        _client = this;
        StartCoroutine(FetchLocationState());
        StartCoroutine(FetchCompanyState());
        StartCoroutine(FetchTruckState());

        StartCoroutine(RefreshWorldTick(.5f));

        if(SpawnEntities) {
        StartCoroutine(RefreshTrucks(.4f));
        }
    }
    UnityWebRequest CallAPI(string uri, APICallType callType, string data = null)
    {
        var request = callType == APICallType.Get ? UnityWebRequest.Get(BaseUrl + uri) : UnityWebRequest.Post(BaseUrl + uri,data,"application/json");
        
        try {
            request.SendWebRequest();
        }
        catch
        {
            Debug.LogError($"Error calling API [{uri}] "+request.downloadHandler.text);
        }

        return request;
    }
    IEnumerator RefreshWorldTick(float interval)
    {
        while (true)
        {
            var worldTickRequest = CallAPI("/world/tick",APICallType.Get);

            yield return worldTickRequest;

            int.TryParse(worldTickRequest.downloadHandler.text,out WorldTick);
            yield return new WaitForSeconds(interval);
        }
    }

    IEnumerator RefreshTrucks(float interval)
    {
        while (true)
        {
            var trucksRequest = CallAPI("/world/trucks",APICallType.Get);
            yield return trucksRequest;

            var updatedTruckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);
                foreach (TruckDTO truckDTO in updatedTruckDTOs)
                {
                    var existingTruckDTO = TruckDTOs.Find(truck => truck.Id == truckDTO.Id);
                    if (existingTruckDTO != null)
                    {
                        existingTruckDTO.Position = truckDTO.Position;
                        existingTruckDTO.DestinationId = truckDTO.DestinationId;
                    }

                }

            yield return new WaitForSeconds(interval);
        }
    }

    const float positionScaleFactor = 5f;

    private IEnumerator FetchTruckState()
    {
        var trucksRequest = CallAPI("/world/trucks",APICallType.Get);
        yield return trucksRequest;

        foreach (TruckDTO truck in TruckDTOs)
        {
            Destroy(truck.GameObject);
        }

        TruckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);
        
        if(!SpawnEntities)
            yield break;
        
        Debug.Log("There are " + TruckDTOs.Count + " trucks to spawn");
        foreach (TruckDTO truck in TruckDTOs)
        {
            var newTruck = Instantiate(boxTruckProto, truck.Position, Quaternion.identity);
            truck.GameObject = newTruck.gameObject;
            truck.GameObject.transform.position *= positionScaleFactor;
        }
    }

    private IEnumerator FetchLocationState()
    {
        var locationsRequest = CallAPI("/world/locations",APICallType.Get);
        yield return locationsRequest;

        LocationDTOs = JsonConvert.DeserializeObject<List<LocationDTO>>(locationsRequest.downloadHandler.text);
            
        if(!SpawnEntities)
            yield break;
            
        Debug.Log("There are " + LocationDTOs.Count + " locations to spawn");

        foreach (LocationDTO location in LocationDTOs)
        {
            if (location.LocationType == LocationType.Producer)
            {
                var newFarm = Instantiate(farmProto, location.Position, Quaternion.identity);
                location.GameObject = newFarm.gameObject;
            }
            else if (location.LocationType == LocationType.Processor)
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
            else if (location.LocationType == LocationType.Town)
            {
                var newTown = Instantiate(townProto, location.Position, Quaternion.identity);
                location.GameObject = newTown.gameObject;
            }
            location.GameObject.transform.position *= positionScaleFactor;
        }
    }

    private IEnumerator FetchCompanyState()
    {
        var companiesRequest = CallAPI("/companies",APICallType.Get);
        yield return companiesRequest;

        CompanyDTOs = JsonConvert.DeserializeObject<List<CompanyDTO>>(companiesRequest.downloadHandler.text);
        Debug.Log("There are " + CompanyDTOs.Count + " companies");
    }

    // Update is called once per frame
    void Update()
    {
        foreach (TruckDTO truck in TruckDTOs)
        {
            if (truck.GameObject != null)
            {
                truck.GameObject.transform.position = Vector3.Lerp(truck.GameObject.transform.position, truck.Position * positionScaleFactor, Time.deltaTime);

                var truckDestination = LocationDTOs.Find(location => location.Id == truck.DestinationId);

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

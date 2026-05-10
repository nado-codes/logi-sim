using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEditor.PackageManager;
using UnityEngine;
using UnityEngine.Networking;


public class Client : MonoBehaviour
{
    public static readonly string BaseUrl = "http://localhost:3001/api";
    public static List<TruckDTO> TruckDTOs = new List<TruckDTO>();
    private static List<GameObject> Trucks = new List<GameObject>();
    public static List<LocationDTO> LocationDTOs = new List<LocationDTO>();
    public static List<GameObject> Locations = new List<GameObject>();
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

            TruckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);

            yield return new WaitForSeconds(interval);
        }
    }

    const float positionScaleFactor = 5f;

    private IEnumerator FetchTruckState()
    {
        var trucksRequest = CallAPI("/world/trucks",APICallType.Get);
        yield return trucksRequest;

        foreach (GameObject truck in Trucks)
        {
            Destroy(truck);
        }

        TruckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text);
        
        if(!SpawnEntities)
            yield break;
        
        Debug.Log("There are " + TruckDTOs.Count + " trucks to spawn");
        foreach (TruckDTO truck in TruckDTOs)
        {
            var newTruck = Instantiate(boxTruckProto, truck.Position.ToVector3(), Quaternion.identity);
            newTruck.name = truck.Id;
            newTruck.transform.position *= positionScaleFactor;
            Trucks.Add(newTruck);
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
            GameObject newLocation;
            if (location.LocationType == LocationType.Producer)
            {
                newLocation = Instantiate(farmProto, location.Position.ToVector3(), Quaternion.identity);
            }
            else if (location.LocationType == LocationType.Processor)
            {
                if (location.Name.ToLower().Contains("bakery"))
                {
                    newLocation = Instantiate(bakeryProto, location.Position.ToVector3(), Quaternion.identity);
                }
                else
                {
                    newLocation = Instantiate(processorProto, location.Position.ToVector3(), Quaternion.identity);
                }
            }
            else
            {
                newLocation = Instantiate(townProto, location.Position.ToVector3(), Quaternion.identity);
            }

            newLocation.name = location.Id;
            newLocation.transform.position *= positionScaleFactor;
            Locations.Add(newLocation);
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
            var truckGO = Trucks.FirstOrDefault(t => t.name == truck.Id);
            if (truckGO != null)
            {
                truckGO.transform.position = Vector3.Lerp(truckGO.transform.position, truck.Position.ToVector3() * positionScaleFactor, Time.deltaTime);

                var truckDestGO = Locations.FirstOrDefault(l => l.name == truck.DestinationId);

                if (truckDestGO != null)
                {
                    var dirToDestination = truckDestGO.transform.position - truck.Position.ToVector3();

                    if (dirToDestination != Vector3.zero)
                    {
                        truckGO.transform.rotation = Quaternion.Lerp(truckGO.transform.rotation, Quaternion.LookRotation(dirToDestination), Time.deltaTime * 5f);
                    }
                }
            }
        }
    }
}

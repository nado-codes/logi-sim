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
    private static List<GameObject> trucks = new List<GameObject>();
    public static List<LocationDTO> LocationDTOs = new List<LocationDTO>();
    private static List<GameObject> locations = new List<GameObject>();
    public static List<CompanyDTO> CompanyDTOs = new List<CompanyDTO>();
    public static List<ContractDTO> ContractDTOs = new List<ContractDTO>();
    public static int WorldTick = 0;

    public GameObject boxTruckProto, flatbedTruckProto;
    public GameObject processorProto, bakeryProto;
    public GameObject farmProto;
    public GameObject townProto;
    public bool SpawnEntities = false;
    const float positionScaleFactor = 5f;

    private static Client _client;

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
        StartCoroutine(RefreshWorldState(.4f));
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

    IEnumerator RefreshWorldState(float interval)
    {
        while (true)
        {
            var companiesRequest = CallAPI("/companies",APICallType.Get);
            yield return companiesRequest;
            CompanyDTOs = JsonConvert.DeserializeObject<List<CompanyDTO>>(companiesRequest.downloadHandler.text) ?? new List<CompanyDTO>();

            var locationsRequest = CallAPI("/world/locations",APICallType.Get);
            yield return locationsRequest;
            LocationDTOs = JsonConvert.DeserializeObject<List<LocationDTO>>(locationsRequest.downloadHandler.text)  ?? new List<LocationDTO>();

            var trucksRequest = CallAPI("/world/trucks",APICallType.Get);
            yield return trucksRequest;
            TruckDTOs = JsonConvert.DeserializeObject<List<TruckDTO>>(trucksRequest.downloadHandler.text) ?? new List<TruckDTO>();

            var contractsRequest = CallAPI("/world/contracts",APICallType.Get);
            yield return contractsRequest;
            ContractDTOs = JsonConvert.DeserializeObject<List<ContractDTO>>(contractsRequest.downloadHandler.text) ?? new List<ContractDTO>();

            var worldTickRequest = CallAPI("/world/tick",APICallType.Get);
            yield return worldTickRequest;
            int.TryParse(worldTickRequest.downloadHandler.text,out WorldTick);

            RefreshWorldEntities();

            yield return new WaitForSeconds(interval);
        }
    }

    private void RefreshWorldEntities()
    {
        if(!SpawnEntities)
            return;
        
        foreach (TruckDTO truck in TruckDTOs)
        {
            var truckGO = trucks.FirstOrDefault(t => t.name == truck.Id);
            if(truckGO != null) 
                continue;

            var newTruck = Instantiate(boxTruckProto, truck.Position.ToVector3(), Quaternion.identity);
            newTruck.name = truck.Id;
            newTruck.transform.position *= positionScaleFactor;
            trucks.Add(newTruck);
        }

        foreach (LocationDTO location in LocationDTOs)
        {
            var locationGO = locations.FirstOrDefault(l => l.name == location.Id);

            if(locationGO != null)
                continue;

            if (location.LocationType == LocationType.Producer)
            {
                locationGO = Instantiate(farmProto, location.Position.ToVector3(), Quaternion.identity);
            }
            else if (location.LocationType == LocationType.Processor)
            {
                if (location.Name.ToLower().Contains("bakery"))
                {
                    locationGO = Instantiate(bakeryProto, location.Position.ToVector3(), Quaternion.identity);
                }
                else
                {
                    locationGO = Instantiate(processorProto, location.Position.ToVector3(), Quaternion.identity);
                }
            }
            else
            {
                locationGO = Instantiate(townProto, location.Position.ToVector3(), Quaternion.identity);
            }

            locationGO.name = location.Id;
            locationGO.transform.position *= positionScaleFactor;
            locations.Add(locationGO);
        }
    }

    // Update is called once per frame
    void Update()
    {
        foreach (TruckDTO truck in TruckDTOs)
        {
            var truckGO = trucks.FirstOrDefault(t => t.name == truck.Id);
            if (truckGO != null)
            {
                truckGO.transform.position = Vector3.Lerp(truckGO.transform.position, truck.Position.ToVector3() * positionScaleFactor, Time.deltaTime);

                var truckDestGO = locations.FirstOrDefault(l => l.name == truck.DestinationId);

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

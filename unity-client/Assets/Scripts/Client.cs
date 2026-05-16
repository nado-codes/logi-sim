using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.SceneManagement;

public enum APICallType
    {
        Get,
        Post
    }

public class Client : MonoBehaviour
{
    public static readonly string BaseUrl = "http://localhost:3001/api";

    public static string PlayerCompanyId => CompanyDTOs.FirstOrDefault(c => c.Name == "NadoCo Logistics")?.Id;
    
    // Entity DTOS
    public static List<TruckDTO> TruckDTOs = new List<TruckDTO>();
    private static List<GameObject> trucks = new List<GameObject>();
    public static List<LocationDTO> LocationDTOs = new List<LocationDTO>();
    private static List<GameObject> locations = new List<GameObject>();
    public static List<CompanyDTO> CompanyDTOs = new List<CompanyDTO>();
    public static List<ContractDTO> ContractDTOs = new List<ContractDTO>();
    public static int WorldTick = 0;

    // Marketplace Item DTOS
    public static List<TruckItemDTO> TruckItemDTOs = new List<TruckItemDTO>();
    public static List<LocationItemDTO> LocationItemDTOs = new List<LocationItemDTO>();

    public GameObject boxTruckProto, flatbedTruckProto;
    public GameObject processorProto, bakeryProto;
    public GameObject farmProto;
    public GameObject townProto;
    public bool SpawnEntities = false;
    const float positionScaleFactor = 5f;

    private static Client _client;

    

    void Awake()
    {
        DontDestroyOnLoad(gameObject);
    }

    void Start()
    {
        _client = this;
        SceneManager.sceneUnloaded += OnSceneUnloaded;
        StartCoroutine(RefreshWorldState(.4f));
        StartCoroutine(RefreshMarketplaceState());
    }

    void OnSceneUnloaded(Scene scene)
    {
        trucks.Clear();
        locations.Clear();
    }

    private static IEnumerator callAPICoroutine(string uri, APICallType callType, 
    Action<bool, string> onComplete, string data)
    {
        var request = callType == APICallType.Get 
        ? UnityWebRequest.Get(BaseUrl + uri) 
        : UnityWebRequest.Post(BaseUrl + uri, data, "application/json");

        yield return request.SendWebRequest();

        var success = request.result == UnityWebRequest.Result.Success;
        var response = request.downloadHandler?.text ?? "";

        if (!success)
        {
            Debug.LogError($"API call to [{uri}] failed: {response}");
        }

        onComplete?.Invoke(success, response);
    }
    
    public static Coroutine CallAPI(string uri, APICallType callType, Action<bool, string> onComplete, string data = null)
    {
        return _client.StartCoroutine(callAPICoroutine(uri, callType, onComplete, data));
    }

    IEnumerator RefreshMarketplaceState()
    {
        yield return CallAPI("/location/items",APICallType.Get,(success,response) =>
        {
            if (!success) Debug.LogError(response);

            var locationsResult = JsonConvert.DeserializeObject<List<LocationItemDTO>>(response);
            if (locationsResult != null)
            {
                LocationItemDTOs = locationsResult;
            }
        });

        yield return CallAPI("/truck/items",APICallType.Get,(success,response) =>
        {
            if (!success) Debug.LogError(response);

            var trucksResult = JsonConvert.DeserializeObject<List<TruckItemDTO>>(response);
            if (trucksResult != null)
            {
                TruckItemDTOs = trucksResult;
            }
        });
    }

    IEnumerator RefreshWorldState(float interval)
    {
        while (true)
        {
            yield return CallAPI("/companies",APICallType.Get,(success,response) =>
            {
                if (!success) Debug.LogError(response);

                var companiesResult = JsonConvert.DeserializeObject<List<CompanyDTO>>(response);
                if (companiesResult != null)
                {
                    CompanyDTOs = companiesResult;
                }
            });

            yield return CallAPI("/world/locations",APICallType.Get,(success,response) =>
            {
                if (!success) Debug.LogError(response);

                var locationsResult = JsonConvert.DeserializeObject<List<LocationDTO>>(response);
                if (locationsResult != null)
                {
                    LocationDTOs = locationsResult;
                }
            });

            yield return CallAPI("/world/trucks",APICallType.Get,(success,response) =>
            {
                if (!success) Debug.LogError(response);

                var trucksResult = JsonConvert.DeserializeObject<List<TruckDTO>>(response);
                if (trucksResult != null)
                {
                    TruckDTOs = trucksResult;
                }
            });

            yield return CallAPI("/world/contracts",APICallType.Get,(success,response) =>
            {
                if (!success) Debug.LogError(response);
                
                var contractsResult = JsonConvert.DeserializeObject<List<ContractDTO>>(response);
                if (contractsResult != null)
                {
                    ContractDTOs = contractsResult;
                }
            });

            yield return CallAPI("/world/tick",APICallType.Get,(success,response) =>
            {
                if (!success) Debug.LogError(response);

                int.TryParse(response, out WorldTick);
            });

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

    public void SwitchToOperatorView()
    {
        SceneManager.LoadScene("OutdoorsScene");
    }

    public void SwitchToOfficeView()
    {
        
        SceneManager.LoadScene("OfficeScene");
    }
}

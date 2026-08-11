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

    public static string? ActiveCompanyId = null;
    
    // Entity DTOS
    public static List<TruckDTO> TruckDTOs = new List<TruckDTO>();
    private static List<GameObject> trucks = new List<GameObject>();
    public static List<LocationDTO> LocationDTOs = new List<LocationDTO>();
    public static List<TownDTO> TownDTOs = new List<TownDTO>();
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
    public GameObject townProto, house1Proto, house2Proto;
    public bool SpawnEntities = false;
    const float positionScaleFactor = 5f;

    private static Client _client;


    void Start()
    {
        _client = this;
        SceneManager.sceneUnloaded += OnSceneUnloaded;
        StartCoroutine(RefreshWorldState(.4f));
        StartCoroutine(RefreshMarketplaceState());
        StartCoroutine(CheckForExpiredContracts(.4f));

        CallAPI("/companies",APICallType.Get,(success,response) =>
        {
            if (!success) Debug.LogError(response);

            var companiesResult = JsonConvert.DeserializeObject<List<CompanyDTO>>(response);
            if (companiesResult != null)
            {
                CompanyDTOs = companiesResult;
            }

            ActiveCompanyId = CompanyDTOs.FirstOrDefault(c => c.Name == "NadoCo Logistics")?.Id;
        });
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

            yield return CallAPI("/world/towns",APICallType.Get,(success,response) =>
            {
                if (!success) Debug.LogError(response);

                var townsResult = JsonConvert.DeserializeObject<List<TownDTO>>(response);
                if (townsResult != null)
                {
                    TownDTOs = townsResult;
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

        foreach (LocationDTO location in LocationDTOs.Where(l => l.LocationType != LocationType.Town))
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

            locationGO.name = location.Id;
            locationGO.transform.position *= positionScaleFactor;
            locations.Add(locationGO);
        }

        

        foreach(TownDTO town in TownDTOs)
        {
            var townGO = locations.FirstOrDefault(l => l.name == town.Id);

            if(townGO == null)
            {
                townGO = Instantiate(townProto, town.Position.ToVector3(), Quaternion.identity);
                townGO.name = town.Id;
                townGO.transform.position *= positionScaleFactor;
                locations.Add(townGO);
            }

            const int maxPopulationPerHouse = 1000;
            var houses = townGO.transform.GetComponentsInChildren<Transform>().Where(t => t.name.StartsWith("House_")).ToList();
            var numExpectedHouses = Math.Max(1, Math.Ceiling((double)town.Population / maxPopulationPerHouse));
            var housesToDelete = houses.Count() - numExpectedHouses;

            for(int i = 0; i < housesToDelete; i++)
            {
                Destroy(houses.ElementAt(i).gameObject);
            }

            var housesToSpawn = numExpectedHouses - houses.Count();
            const float minHouseDistance = 25f; // tweak to taste
            const float minTownHallDistance = 5f;
            const int maxSpawnAttempts = 10;
            float minSpawnRadius = minHouseDistance;
            
            for(int i = 0; i < housesToSpawn; i++)
            {
                Vector3 finalPosition = Vector3.zero;
                bool placed = false;

                for(int attempt = 0; attempt < maxSpawnAttempts; attempt++)
                {
                    var position = UnityEngine.Random.insideUnitCircle;
                    var position3D = new Vector3(position.x, 0, position.y) * positionScaleFactor;
                    var candidate = position3D + (position3D.normalized * (minTownHallDistance + UnityEngine.Random.Range(minSpawnRadius, minSpawnRadius + minHouseDistance))); 
                                 
                    bool tooClose = false;
                    foreach(var existingHouse in houses)
                    {
                        if(Vector3.Distance(existingHouse.transform.localPosition, candidate) < minHouseDistance)
                        {
                            tooClose = true;
                            break;
                        }
                    }

                    if(!tooClose)
                    {
                        finalPosition = candidate;
                        placed = true;
                        break;
                    }
                }

                if(!placed) {
                    minSpawnRadius += minHouseDistance; // expand search radius for next attempt if we keep finding positions that are too close
                    continue; // skip this house if we can't find space
                }

                var randomHouseType = UnityEngine.Random.Range(0, 2);
                var houseProto = randomHouseType == 0 ? house1Proto : house2Proto;
                var houseGO = Instantiate(houseProto, townGO.transform.position, 
                                          Quaternion.LookRotation(-finalPosition));
                houseGO.transform.parent = townGO.transform;
                houseGO.transform.localPosition = finalPosition;
                houseGO.name = $"House_{i+1}";
                houses.Add(houseGO.transform);
            }
        }
    }

    private IEnumerator CheckForExpiredContracts(float interval)
    {
        while (true) {
            var expiredContracts = ContractDTOs.Where(c => c.ExpectedTick <= WorldTick).ToList();
            var companyContacts = expiredContracts.Where(c => c.ShipperId == ActiveCompanyId).ToList();
            var companyDebts = CompanyDTOs.FirstOrDefault(c => c.Id == ActiveCompanyId)?.Debts ?? new CompanyDebtDTO[0];

            if(expiredContracts.Count > 0)
            {
                Debug.Log("[CheckForExpiredContracts] Found "+expiredContracts.Count+" expired contracts");

                if(companyContacts.Count > 0)
                {
                    Debug.Log(" - "+companyContacts.Count+" of them belongs to the active company");

                    if(companyDebts.Length > 0)
                    {
                        Debug.Log(" - The active company currently has debt with "+companyDebts.Count()+" creditors");
                    }
                }
                else
                {
                    Debug.Log(" - None of them belong to the active company, so we won't open a prompt");
                }
            }

            foreach(var contract in companyContacts)
            {
                var contractCompany = CompanyDTOs.FirstOrDefault(c => c.Id == contract.CompanyId);
                if(contractCompany == null)
                {
                    Debug.LogError($"Contract {contract.Id} has expired at tick {WorldTick}, but the company with ID {contract.CompanyId} could not be found.");
                    ContractDTOs.Remove(contract);
                    continue;
                }
                /* var debt = companyDebts.FirstOrDefault(d => d.CreditorCompanyId == contractCompany?.Id);
                if(debt == null)
                {
                    Debug.LogError($"Contract {contract.Id} has expired at tick {WorldTick}, but no debt was found for company {contractCompany?.Name} (ID: {contractCompany?.Id}).");
                    ContractDTOs.Remove(contract);
                    continue;
                }*/ // TODO: The amount owed should be displayed in the prompt.
                Prompt.Show("Contract Expired", $"Contract {contract.Id} has expired at tick {WorldTick}. You now owe {contractCompany?.Name} money for the failed contract. Due to the debt, your company is now insolvent and you cannot take new contracts or purchase assets until you resolve your debts.");
                Debug.Log($"Contract {contract.Id} has expired at tick {WorldTick}. Removing from active contracts.");
                ContractDTOs.Remove(contract);
            }

            yield return new WaitForSeconds(interval);
        }
    }

    void Update()
    {
        foreach (TruckDTO truck in TruckDTOs)
        {
            var truckGO = trucks.FirstOrDefault(t => t.name == truck.Id);
            if (truckGO != null)
            {
                var serverPos = truck.Position.ToVector3() * positionScaleFactor;
                var truckDestGO = locations.FirstOrDefault(l => l.name == truck.DestinationId);
            
                if (truckDestGO != null)
                {
                    var dirToDestination = truckDestGO.transform.position - truckGO.transform.position;

                    if (dirToDestination != Vector3.zero)
                    {
                        truckGO.transform.rotation = Quaternion.Lerp(truckGO.transform.rotation, Quaternion.LookRotation(dirToDestination), Time.deltaTime * 5f);
                    }

                    truckGO.transform.position = Vector3.MoveTowards(
                        truckGO.transform.position,
                        truckDestGO.transform.position,
                        20 * Time.deltaTime
                    );
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

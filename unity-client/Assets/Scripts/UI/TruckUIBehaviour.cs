using UnityEngine;
using TMPro;

public class TruckUIBehaviour : MonoBehaviour
{
    void Update()
    {
        var truck = Client.TruckDTOs.Find(truck => truck.Id == transform.parent.gameObject.name);
        if (truck != null)
        {
            var truckCompany = Client.CompanyDTOs.Find(company => company.Id == truck.CompanyId);
            var txName = transform.Find("txName").GetComponent<TextMeshProUGUI>();
            txName.text = truck.Name;

            var txCompanyName = transform.Find("txCompanyName").GetComponent<TextMeshProUGUI>();
            txCompanyName.text = truckCompany != null ? truckCompany.Name : "Unknown Company";
            
            if(truckCompany.Id != Client.ActiveCompanyId) 
            {
                transform.Find("txResource").gameObject.SetActive(false);
                transform.Find("txDestination").gameObject.SetActive(false);
                return;
            }
            else
            {
                transform.Find("txResource").gameObject.SetActive(true);
                transform.Find("txDestination").gameObject.SetActive(true);
            }

            var txResource = transform.Find("txResource").GetComponent<TextMeshProUGUI>();
            txResource.text = truck.Storage.ResourceType + ": " + truck.Storage.ResourceCount + " / " + truck.Storage.ResourceCapacity;

            var truckDestination = Client.LocationDTOs.Find(location => location.Id == truck.DestinationId);
            var txDestination = transform.Find("txDestination").GetComponent<TextMeshProUGUI>();
            txDestination.text = "Destination: " + (truckDestination != null ? truckDestination.Name : "None");
        }
    }
}

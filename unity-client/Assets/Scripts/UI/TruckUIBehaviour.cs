using UnityEngine;
using TMPro;

public class TruckUIBehaviour : MonoBehaviour
{
    void Update()
    {
        var camera = Camera.main;
        if (camera != null)
        {
            transform.LookAt(transform.position + camera.transform.rotation * Vector3.forward, camera.transform.rotation * Vector3.up);
        }

        var truck = Client.TruckDTOs.Find(truck => truck.Id == transform.parent.gameObject.name);
        if (truck != null)
        {
            var truckCompany = Client.CompanyDTOs.Find(company => company.Id == truck.CompanyId);
            if(truckCompany.Id != Client.PlayerCompanyId) 
                return;

            var txName = transform.Find("txName").GetComponent<TextMeshProUGUI>();
            txName.text = truck.Name;

            
            var txCompanyName = transform.Find("txCompanyName").GetComponent<TextMeshProUGUI>();
            txCompanyName.text = truckCompany != null ? truckCompany.Name : "Unknown Company";

            var txResource = transform.Find("txResource").GetComponent<TextMeshProUGUI>();
            txResource.text = truck.Storage.ResourceType + ": " + truck.Storage.ResourceCount + " / " + truck.Storage.ResourceCapacity;

            var truckDestination = Client.LocationDTOs.Find(location => location.Id == truck.DestinationId);
            var txDestination = transform.Find("txDestination").GetComponent<TextMeshProUGUI>();
            txDestination.text = "Destination: " + (truckDestination != null ? truckDestination.Name : "None");
        }
    }
}

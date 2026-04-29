using UnityEngine;
using TMPro;

public class TruckUIBehaviour : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {
        var camera = Camera.main;
        if (camera != null)
        {
            transform.LookAt(transform.position + camera.transform.rotation * Vector3.forward, camera.transform.rotation * Vector3.up);
        }

        var truck = Client.Instance.truckDTOs.Find(truck => truck.GameObject == transform.parent.gameObject);
        if (truck != null)
        {
            var txName = transform.Find("txName").GetComponent<TextMeshProUGUI>();
            txName.text = truck.Name;

            var truckCompany = Client.Instance.companyDTOs.Find(company => company.Id == truck.companyId);
            var txCompanyName = transform.Find("txCompanyName").GetComponent<TextMeshProUGUI>();
            txCompanyName.text = truckCompany != null ? truckCompany.Name : "Unknown Company";

            var txResource = transform.Find("txResource").GetComponent<TextMeshProUGUI>();
            txResource.text = truck.Storage.ResourceType + ": " + truck.Storage.ResourceCount + " / " + truck.Storage.ResourceCapacity;

            var truckDestination = Client.Instance.locationDTOs.Find(location => location.Id == truck.DestinationId);
            var txDestination = transform.Find("txDestination").GetComponent<TextMeshProUGUI>();
            txDestination.text = "Destination: " + (truckDestination != null ? truckDestination.Name : "None");
        }
    }
}

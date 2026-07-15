
using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;

public class TruckDispatchDropdown : UIDropdown
{
    private string getContractNameWithDistance(ContractViewModel contractVM,ContractDTO contractDTO)
    {
        var supplier = Client.LocationDTOs.FirstOrDefault(l => l.Id == contractDTO.SupplierId);
        var destination = Client.LocationDTOs.FirstOrDefault(l => l.Id == contractDTO.DestinationId);
        var distanceToSupplier = Pos3D.Distance(supplier.Position,Client.TruckDTOs.Find(t => t.Id == gameObject.name).Position);
        var distanceFromSupplierToDestination = Pos3D.Distance(supplier.Position,destination.Position);
        var totalDistance = distanceToSupplier+distanceFromSupplierToDestination;
        return $"{contractVM.DestinationName} - {totalDistance:0.00}m";
    }
    private string getTripCount(ContractDTO contract, TruckDTO truck)
    {
        var amountLeftToDeliver = contract.TotalAmount-contract.DeliveredAmount;
        return $"{Math.Ceiling(amountLeftToDeliver/truck.Storage.ResourceCapacity)} trips";
    }
    protected override void OnOpen(string truckId)
    {
        if(canvasGroupToggle.IsVisible)
            return;

        var truck = Client.TruckDTOs.Find(c => c.Id == truckId);

        if(truck == null)
        {
            Debug.LogError($"TruckDispatchDropdown: No truck found with id {truckId}");
            return;
        }

        var companyContracts = Client.ContractDTOs.Where(t => t.CompanyId == Client.ActiveCompanyId);
        var validContracts = companyContracts.Where(c => truck.Storage != null && c.ResourceType == truck.Storage.ResourceType).ToList();
        var contractVMs = validContracts.Select(c => ContractViewModel.FromDTO(c,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick)).ToList();

        Populate(contractVMs,(contractId) =>
        {
            var contract = validContracts.Find(c => c.Id == contractId);
          var contractNameWithDistance = getContractNameWithDistance(contractVMs.Find(c => c.Id == contractId),contract);
        
          return new List<UIItemAction>()
            {
                new UIItemAction()
                {
                    Name = contractNameWithDistance + $"({getTripCount(contract,truck)})",
                    Callback = (contractId) =>
                    {
                        Client.CallAPI("/contract/assignTruck",APICallType.Post,(success,response) =>
                        {
                            if (!success) {
                                Debug.LogError(response);
                                Debug.LogError($"Failed to assign contract {contractId} to truck {contractId}: {response}");
                            }   
                        },JsonConvert.SerializeObject(new 
                        { 
                            contractId,
                            truckId
                        }));

                        Close();
                    }
                }
            };  
        } );
    }
}


using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;

public class ContractDispatchDropdown : UIDropdown
{
    protected override void OnOpen(string contractId)
    {
        if(isOpen)
            return;
            
        var contract = Client.ContractDTOs.Find(c => c.Id == contractId);

        if(contract == null)
        {
            Debug.LogError($"ContractDispatchDropdown: No contract found with id {contractId}");
            return;
        }

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.ActiveCompanyId);
        var validTrucks = companyTrucks.Where(t => t.Storage != null && t.Storage.ResourceType == contract.ResourceType);
        var idleTrucks = validTrucks.Where(t => string.IsNullOrEmpty(t.ContractId));
        var supplier = Client.LocationDTOs.FirstOrDefault(l => l.Id == contract.SupplierId);
        
        if(supplier == null)
        {
            Debug.LogError($"Supplier with id ${contract.SupplierId} doesn't exist");
        }

        var closestTruck = idleTrucks.Aggregate((a,c) => Pos3D.Distance(a.Position,supplier.Position) > Pos3D.Distance(c.Position,supplier.Position) ? c : a);
        var idleTruckVMs = idleTrucks.Select(t => TruckViewModel.FromDTO(t,Client.CompanyDTOs,Client.LocationDTOs)).ToList();

        Populate(idleTruckVMs,(truckId) => new List<UIItemAction>()
        {
            new UIItemAction()
            {
                Name = idleTruckVMs.Find(t => t.Id == truckId).Name + (truckId == closestTruck.Id ? " - Closest" : ""),
                Callback = (truckId) =>
                {
                    Client.CallAPI("/contract/assignTruck",APICallType.Post,(success,response) =>
                    {
                        if (!success) {
                            Debug.LogError(response);
                            Debug.LogError($"Failed to assign contract {contractId} to truck {truckId}: {response}");
                        }   
                    },JsonConvert.SerializeObject(new 
                    { 
                        contractId, 
                        truckId 
                    }));

                    Close();
                }
            }
        });
    }
}

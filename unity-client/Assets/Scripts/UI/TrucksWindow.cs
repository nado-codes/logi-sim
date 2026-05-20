using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;

public class TrucksWindow : BaseWindow<TrucksWindow>
{
    private UITable table;

    private UIItemAction rowSellAction = new UIItemAction()
    {
        Name = "Sell",
        Callback = (truckId) =>
        {
            Client.CallAPI("/truck/sell",APICallType.Post,(success,response) =>
            {
                if (!success) {
                    Debug.LogError(response);
                    Debug.LogError($"Failed to sell truck {truckId}: {response}");
                }   
            },JsonConvert.SerializeObject(new 
            { 
                truckId, 
                companyId = Client.ActiveCompanyId 
            }));
        }
    };

    private UIItemAction rowDispatchAction = new UIItemAction()
    {
        Name = "Dispatch",
        Callback = (truckId) =>
        {
            /* Client.CallAPI("/contract/break",APICallType.Post,(success,response) =>
            {
                if (!success) {
                    Debug.LogError(response);
                    Debug.LogError($"Failed to break contract {contractId}: {response}");
                }   
            },JsonConvert.SerializeObject(new 
            { 
                contractId, 
                companyId = Client.PlayerCompanyId,
                breakType = ContractBreakType.Shipper 
            })); */
        }
    };

    protected override void Start()
    {
        base.Start();
        table = GetComponentInChildren<UITable>();

        if(table == null)
        {
            throw new System.NullReferenceException("TrucksWindow: No UITable found in children");
        }

        Close();
    }

    void Update()
    {
        if(!canvasGroupToggle.IsVisible)
            return;

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.ActiveCompanyId).ToList();
        var truckVMs = companyTrucks.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        table.Refresh(truckVMs.ToList());
    }

    public new void Open()
    {
        if(canvasGroupToggle.IsVisible)
            return;

        base.Open();

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.ActiveCompanyId).ToList();
        var truckVMs = companyTrucks.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        table.Populate(truckVMs.ToList(),(truckId) => new List<UIItemAction>(){rowSellAction});
    }

    public new void Close()
    {
        base.Close();
    }
}

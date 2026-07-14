using System.Collections.Generic;
using System.Linq;
using System;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.UI;

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
        Callback = (truckId) => // .. TODO: this was requested to be added during the last playtest ... make it so players can dispatch trucks from this window too
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

    private Button btnBuyTruck;

    protected override void Start()
    {
        base.Start();
        table = GetComponentInChildren<UITable>();

        if(table == null)
        {
            throw new NullReferenceException("TrucksWindow: No UITable found in children");
        }

        btnBuyTruck = transform.Find("BuyTruckButton")?.GetComponent<Button>();

        if(btnBuyTruck == null)
        {
            throw new NullReferenceException("TrucksWindow: No BuyTruckButton found in children");
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

        var playerCompany = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.ActiveCompanyId);
        if(playerCompany == null)
        {
            throw new NullReferenceException("TrucksWindow: Player company not found in Client.CompanyDTOs");
        }

        btnBuyTruck.interactable = !playerCompany.IsInsolvent;

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.ActiveCompanyId).ToList();
        var truckVMs = companyTrucks.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        table.Populate(truckVMs.ToList(),(truckId) => new List<UIItemAction>(){rowSellAction});
    }

    public new void Close()
    {
        base.Close();
    }
}

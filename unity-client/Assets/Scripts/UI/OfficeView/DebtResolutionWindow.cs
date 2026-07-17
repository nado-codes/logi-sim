using UnityEngine;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

public class DebtResolutionWindow : BaseWindow<DebtResolutionWindow>
{
    private UIList list;
    private List<TruckItemViewModel> truckItemVMs;

    private void SellTruck(string truckId)
    {
        Debug.Log("selling truckId: " + truckId);
        truckItemVMs.RemoveAll(t => t.Id == truckId);
        list.Refresh(truckItemVMs);
        Client.CallAPI("/truck/sell",APICallType.Post,(success,response) =>
        {
            if (!success) {
                Debug.LogError(response);
                Debug.LogError($"Failed to sell truck {truckId}: {response}");
            }   
        },JsonConvert.SerializeObject(new 
        { 
            truckId
        }));
    }

    protected override void Start()
    {
        base.Start();
        list = GetComponentInChildren<UIList>();

        if(list == null)
        {
            throw new System.NullReferenceException("TrucksMarketplace: No UIList found in children");
        }
        Close();
    }


    public new void Open()
    {
        if(canvasGroupToggle.IsVisible)
            return;

        base.Open();

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.ActiveCompanyId).ToList();

        truckItemVMs = new List<TruckItemViewModel>();
        foreach(TruckDTO truck in companyTrucks)
        {
            var truckItemVM = TruckItemViewModel.FromDTO(Client.TruckItemDTOs.FirstOrDefault(t => t.Id == truck.ItemId));
            truckItemVM.Id = truck.Id; // .. We (really) should be mutating the id of a truck item ... but need to do this for the playtest. We'll fix it later
            // .. mutating the truckItemId allows the "sell" button to work, because the API needs to know which truck we're referring to
            truckItemVM.Specs = $" - Carries {truckItemVM.ResourceCapacity} of {truckItemVM.ResourceName} at {truckItemVM.Speed} m/s";
            truckItemVMs.Add(truckItemVM);
        }

        list.Populate(truckItemVMs,(truckItemId) => new List<UIItemAction>(){
            new UIItemAction(){
                Name = "Sell",
                Callback = (truckId) => SellTruck(truckId)
            } });
    }

    public new void Close()
    {
        base.Close();
    }
}
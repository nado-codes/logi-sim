using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;

public class TrucksMarketplace : BaseWindow<TrucksMarketplace>
{
    private UIList list;

    private UIItemAction purchaseTruckAction = new UIItemAction()
    {
        Name = "Purchase",
        Callback = (itemId) =>
        {
            Debug.Log("truckItemId: " + itemId);
            Client.CallAPI("/truck/purchase",APICallType.Post,(success,response) =>
            {
                if (!success) {
                    Debug.LogError(response);
                    Debug.LogError($"Failed to purchase truck {itemId}: {response}");
                }   
            },JsonConvert.SerializeObject(new 
            { 
                itemId, 
                companyId = Client.ActiveCompanyId,
                position = new Pos3D(0,0,0) // For now we just spawn the truck at 0,0,0 and let the player move it to the desired location
            }));
        }
    };

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

        var truckItemVMs = Client.TruckItemDTOs.Select(dto =>
        {
            var truckVM = TruckItemViewModel.FromDTO(dto);
            truckVM.Specs = $" - Carries {truckVM.ResourceCapacity} of {truckVM.ResourceName} at {truckVM.Speed} m/s";
            return truckVM;
        }).ToList();
        list.Populate(truckItemVMs,(truckItemId) => new List<UIItemAction>(){ purchaseTruckAction });
    }

    public new void Close()
    {
        base.Close();
    }
}

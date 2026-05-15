using System.Collections.Generic;
using System.Linq;

public class TrucksWindow : BaseWindow<TrucksWindow>
{
    private UITable table;
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
        if(!IsOpen) 
            return;

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.PlayerCompanyId).ToList();
        var truckVMs = companyTrucks.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        table.Refresh(truckVMs.ToList());
    }

    public new void Open()
    {
        base.Open();

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.PlayerCompanyId).ToList();
        var truckVMs = companyTrucks.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        table.Populate(truckVMs.ToList(),new List<UIAction>());
    }

    public new void Close()
    {
        base.Close();
    }
}

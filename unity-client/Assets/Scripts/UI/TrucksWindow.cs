using System.Collections.Generic;
using System.Linq;

public class TrucksWindow : BaseWindow<TrucksWindow>
{
    public UITable Table;
    protected override void Start()
    {
        base.Start();
        Table = GetComponentInChildren<UITable>();
        Close();
    }

    void Update()
    {
        if(!IsOpen) 
            return;

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.PlayerCompanyId).ToList();
        var truckVMs = companyTrucks.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        Table.Refresh(truckVMs.ToList());
    }

    public new void Open()
    {
        base.Open();

        var companyTrucks = Client.TruckDTOs.Where(t => t.CompanyId == Client.PlayerCompanyId).ToList();
        var truckVMs = companyTrucks.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        Table.Populate(truckVMs.ToList(),new List<RowAction>());
    }

    public new void Close()
    {
        base.Close();
    }
}

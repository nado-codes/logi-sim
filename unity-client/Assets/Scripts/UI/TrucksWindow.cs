using System.Collections.Generic;
using System.Linq;

public class TrucksWindow : BaseWindow<TrucksWindow>
{
    private UITable table;
    protected override void Start()
    {
        base.Start();
        table = GetComponentInChildren<UITable>();
        Close();
    }

    void Update()
    {
        if(!IsOpen) 
            return;

        var truckVMs = Client.TruckDTOs.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        table.Refresh(truckVMs.ToList());
    }

    public new void Open()
    {
        base.Open();

        var truckVMs = Client.TruckDTOs.Select(dto => TruckViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs));
        table.Populate(truckVMs.ToList(),new List<RowAction>());
    }

    public new void Close()
    {
        base.Close();
    }
}

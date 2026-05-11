using System.Collections.Generic;
using System.Linq;

public class ContractsWindow : BaseWindow<ContractsWindow>
{
    private UITable table;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    protected override void Start()
    {
        base.Start();
        table = GetComponentInChildren<UITable>();
        Close();
    }

    // Update is called once per frame
    void Update()
    {
        if(!IsOpen) 
            return;

        var availableContractDTOs = Client.ContractDTOs.Where(dto => dto.AcceptedAtTick == null);
        var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
        table.Refresh(contractVMs.ToList());
    }

    public new void Open()
    {
        base.Open();

        var availableContractDTOs = Client.ContractDTOs.Where(dto => dto.AcceptedAtTick == null);
        var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
        table.Populate(contractVMs.ToList(),new List<RowAction>());
    }

    public new void Close()
    {
        base.Close();
    }
}

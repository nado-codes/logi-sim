using System.Linq;
using System.Collections.Generic;

public class CompanySelectionDropdown : UIDropdown
{
    public void Open()
    {
        Open("");
    }

    protected override void OnOpen(string playerId)
    {
        if(canvasGroupToggle.IsVisible)
            return;

        var companiesVMs = Client.CompanyDTOs.Select(c => CompanyViewModel.FromDTO(c)).ToList();

        Populate(companiesVMs,(companyId) => new List<UIItemAction>()
        {
            new UIItemAction()
            {
                Name = companiesVMs.Find(c => c.Id == companyId).Name,
                Callback = (companyId) =>
                {
                    Client.ActiveCompanyId = companyId;
                    Close();
                }
            }
        });
    }
}
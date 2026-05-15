using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ContractsWindow : BaseWindow<ContractsWindow>
{
    private UITable table;
    public Button companyContractsButton;
    private bool filterCompanyContracts = false;

    private UIAction rowAcceptAction = new UIAction()
    {
        Name = "Accept",
        Callback = (contractId) =>
        {
            Client.CallAPI("/contract/assignCompany",APICallType.Post,(success,response) =>
            {
                if (!success) {
                    Debug.LogError(response);
                    Debug.LogError($"Failed to accept contract {contractId}: {response}");
                }   
            },JsonConvert.SerializeObject(new 
            { 
                contractId, 
                companyId = Client.PlayerCompanyId 
            }));
        }
    };

    private UIAction rowBreakAction = new UIAction()
    {
        Name = "Break",
        Callback = (contractId) =>
        {
            Client.CallAPI("/contract/break",APICallType.Post,(success,response) =>
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
            }));
        }
    };
    
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    protected override void Start()
    {
        base.Start();
        table = GetComponentInChildren<UITable>();

        if(table == null)
        {
            throw new System.NullReferenceException("TrucksWindow: No UITable found in children");
        }

        if(!companyContractsButton)
        {
            Debug.LogError("ContractsWindow: Company Contracts Button is not assigned in the inspector");
        }
        else
        {
            companyContractsButton.onClick.AddListener(ToggleCompanyContractsFilter);
        }

        Close();
    }

    // Update is called once per frame
    void Update()
    {
        if(!IsOpen) 
            return;

        var availableContractDTOs = new List<ContractDTO>();
        if (filterCompanyContracts)
        {
            availableContractDTOs = Client.ContractDTOs.Where(dto => dto.ShipperId == Client.PlayerCompanyId).ToList();
        }
        else
        {
            availableContractDTOs = Client.ContractDTOs.Where(dto => dto.AcceptedAtTick == null).ToList();
        }

        var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
        table.Refresh(contractVMs.ToList());
    }

    public void ToggleCompanyContractsFilter()
    {
        filterCompanyContracts = !filterCompanyContracts;
        var btnImage = companyContractsButton.GetComponent<Image>();
        if(!btnImage)
        {
            Debug.LogError("ContractsWindow: Could not find Image component on Company Contracts Button");
            return;
        }
        var btnText = companyContractsButton.GetComponentInChildren<TextMeshProUGUI>();
        if(!btnText)
        {
            Debug.LogError("ContractsWindow: Could not find Text component on Company Contracts Button");
            return;
        }

        btnText.text = filterCompanyContracts ? "Show All Contracts" : "Show Company Contracts";
        btnImage.color = filterCompanyContracts ? Color.green : Color.white;
        table.SetActions(filterCompanyContracts ? new List<UIAction>() {rowBreakAction} : new List<UIAction>(){
            rowAcceptAction
        });
    }

    public new void Open()
    {
        base.Open();

        var availableContractDTOs = Client.ContractDTOs.Where(dto => dto.AcceptedAtTick == null);
        var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
        table.Populate(contractVMs.ToList(),new List<UIAction>()
        {
            rowAcceptAction
        });
    }

    public new void Close()
    {
        base.Close();
    }
}

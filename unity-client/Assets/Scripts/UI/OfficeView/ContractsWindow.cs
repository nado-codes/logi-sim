using System.Collections.Generic;
using System.Linq;
using System;
using Newtonsoft.Json;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ContractsWindow : BaseWindow<ContractsWindow>
{
    private UITable table;
    private ContractDispatchDropdown dispatchDropdown;

    public Button companyContractsButton;
    private bool filterCompanyContracts = false;

    private UIItemAction contractAcceptAction = new UIItemAction()
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
                companyId = Client.ActiveCompanyId 
            }));
        }
    };

    private UIItemAction contractBreakAction = new UIItemAction()
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
                companyId = Client.ActiveCompanyId,
                breakType = ContractBreakType.Shipper 
            }));
        }
    };

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    protected override void Start()
    {
        base.Start();
        table = GetComponentInChildren<UITable>();
        dispatchDropdown = GetComponentInChildren<ContractDispatchDropdown>();

        if(table == null)
        {
            throw new NullReferenceException("ContractsWindow: No UITable found in children");
        }
        if(dispatchDropdown == null)
        {
            throw new NullReferenceException("ContractsWindow: No ContractDispatchDropdown found in children");
        }
        if(companyContractsButton == null)
        {
            throw new NullReferenceException("ContractsWindow: Company Contracts Button is not assigned in the inspector");
        }

        Close();
    }

    void Update()
    {
        var availableContractDTOs = new List<ContractDTO>();
        if (filterCompanyContracts)
        {
            availableContractDTOs = Client.ContractDTOs.Where(dto => dto.ShipperId == Client.ActiveCompanyId).ToList();
        }
        else
        {
            availableContractDTOs = Client.ContractDTOs.Where(dto => dto.AcceptedAtTick == null).ToList();
        }

        var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
        table.Refresh(contractVMs.ToList());
    }

    private UIItemAction getContractDispatchAction()
    {
        return new UIItemAction()
        {
            Name = "Dispatch",
            Callback = (contractId) =>
            {
                dispatchDropdown.Open(contractId);
            }
        };
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
        table.SetActionFactory(filterCompanyContracts ? (contractId) => new List<UIItemAction>() {getContractDispatchAction(),contractBreakAction} : (contractId) => new List<UIItemAction>(){
            contractAcceptAction
        });
    }

    public new void Open()
    {
        if(canvasGroupToggle.IsVisible)
            return;

        base.Open();

        var availableContractDTOs = Client.ContractDTOs.Where(dto => dto.AcceptedAtTick == null);
        var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
        table.Populate(contractVMs.ToList(),(contractId) => new List<UIItemAction>
        {
            contractAcceptAction
        });
    }

    public new void Close()
    {
        base.Close();
    }
}

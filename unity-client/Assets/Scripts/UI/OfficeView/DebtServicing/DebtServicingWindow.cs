using UnityEngine;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System;

public class DebtServicingWindow : BaseWindow<DebtServicingWindow>
{
    private UIList list;
    private List<CompanyDebtViewModel> companyDebtVMs;
    private PartialPaymentPopup partialPaymentPopup;

    protected override void Awake()
    {
        partialPaymentPopup = GetComponentInChildren<PartialPaymentPopup>();

        if(partialPaymentPopup == null)
        {
            throw new NullReferenceException("DebtServicingWindow: No PartialPaymentPopup found in children");
        }

        base.Awake();
    }

    protected override void Start()
    {
        base.Start();
        list = GetComponentInChildren<UIList>();

        if(list == null)
        {
            throw new NullReferenceException("DebtServicing: No UIList found in children");
        }
        Close();
    }

    private void PayDebtInFull(string debtId)
    {
        Debug.Log("paying debt in full: " + debtId);
        companyDebtVMs.RemoveAll(t => t.Id == debtId);
        list.Refresh(companyDebtVMs);
        /*Client.CallAPI("/company/pay-debt-in-full",APICallType.Post,(success,response) =>
        {
            if (!success) {
                Debug.LogError(response);
                Debug.LogError($"Failed to pay debt {debtId} in full: {response}");
            }   
        },JsonConvert.SerializeObject(new 
        { 
            debtId
        }));*/
    }

    public new void Open()
    {
        if(canvasGroupToggle.IsVisible)
            return;

        base.Open();

        var activeCompanyDTO = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.ActiveCompanyId);

        companyDebtVMs = new List<CompanyDebtViewModel>();
        foreach(CompanyDebtDTO debt in activeCompanyDTO.Debts)
        {
            debt.Id = Guid.NewGuid().ToString();
            var companyDebtVM = CompanyDebtViewModel.FromDTO(debt);
            companyDebtVMs.Add(companyDebtVM);
        }

        list.Populate(companyDebtVMs,(debtId) => new List<UIItemAction>(){
            new UIItemAction(){
                Name = "Pay In Full",
                Callback = (debtId) => PayDebtInFull(debtId)
            } ,new UIItemAction(){
                Name = "Partial Payment",
                Callback = (debtId) =>
                {
                    partialPaymentPopup.Open();
                    var companyName = companyDebtVMs.FirstOrDefault(d => d.Id == debtId)?.CreditorCompanyName ?? "Unknown Creditor";
                    partialPaymentPopup.Setup(companyName, debtId);
                }
            } });
    }

    public new void Close()
    {
        base.Close();
    }
}
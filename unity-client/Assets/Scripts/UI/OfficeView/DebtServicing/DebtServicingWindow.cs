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

        partialPaymentPopup.OnPaymentSucceeded += (debtId, amount) => RefreshDebtList();

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
        var debtVM = companyDebtVMs.FirstOrDefault(t => t.Id == debtId);
        if (debtVM == null) return;

        Client.CallAPI(
            $"/company/{Client.ActiveCompanyId}/debts/{debtVM.CreditorCompanyId}/pay",
            APICallType.Post,
            (success, response) =>
            {
                if (success)
                {
                    companyDebtVMs.RemoveAll(t => t.Id == debtId);
                    list.Refresh(companyDebtVMs);
                    PopupController.ShowPopup("Payment Successful", $"Paid {debtVM.CreditorCompanyName} in full.");

                    if (companyDebtVMs.Count == 0)
                    {
                        Close();
                    }
                }
                else
                {
                    Debug.LogError($"Failed to pay debt {debtId} in full: {response}");
                    PopupController.ShowPopup("Payment Failed", Utils.ExtractErrorMessage(response));
                }
            },
            JsonConvert.SerializeObject(new { amount = debtVM.RawAmount })
        );
    }

    private void RefreshDebtList()
    {
        var activeCompanyDTO = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.ActiveCompanyId);

        companyDebtVMs = new List<CompanyDebtViewModel>();

        if (activeCompanyDTO != null)
        {
            foreach(CompanyDebtDTO debt in activeCompanyDTO.Debts)
            {
                debt.Id = Guid.NewGuid().ToString();
                var companyDebtVM = CompanyDebtViewModel.FromDTO(debt);
                companyDebtVMs.Add(companyDebtVM);
            }
        }

        list.Populate(companyDebtVMs,(debtId) => new List<UIItemAction>(){
            new UIItemAction(){
                Name = "Pay In Full",
                Callback = (debtId) => PayDebtInFull(debtId)
            } ,new UIItemAction(){
                Name = "Partial Payment",
                Callback = (debtId) =>
                {
                    var debtVM = companyDebtVMs.FirstOrDefault(d => d.Id == debtId);
                    if (debtVM == null) return;

                    partialPaymentPopup.Open();
                    partialPaymentPopup.Setup(debtVM.CreditorCompanyName, debtVM.CreditorCompanyId, debtId, debtVM.RawAmount);
                }
            } });

        if (companyDebtVMs.Count == 0)
        {
            Close();
        }
    }

    public new void Open()
    {
        if(canvasGroupToggle.IsVisible)
            return;

        base.Open();

        RefreshDebtList();
    }

    public new void Close()
    {
        base.Close();
    }
}
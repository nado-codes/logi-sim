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
    private bool paymentInFlight;

    protected override void Awake()
    {
        partialPaymentPopup = GetComponentInChildren<PartialPaymentPopup>();

        if(partialPaymentPopup == null)
        {
            throw new NullReferenceException("DebtServicingWindow: No PartialPaymentPopup found in children");
        }

        partialPaymentPopup.OnPaymentSucceeded += (debtResponse) =>
        {
            var activeCompany = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.ActiveCompanyId);

            if (activeCompany == null)
            {
                Debug.LogWarning("DebtServicingWindow: Payment succeeded but the updated debt or active company was missing; rebuilding list from current data.");
                RefreshDebtList();
                return;
            }

            if(debtResponse.Debt == null)
            {
                activeCompany.Debts = activeCompany.Debts.Where(d => d.CreditorCompanyId != debtResponse.CreditorCompanyId).ToArray();
            }
            else
            {
                int index = Array.FindIndex(activeCompany.Debts, d => d.CreditorCompanyId == debtResponse.Debt.CreditorCompanyId);
            
                if (debtResponse.Debt.Amount <= 0)
                {
                    activeCompany.Debts = activeCompany.Debts.Where(d => d.CreditorCompanyId != debtResponse.Debt.CreditorCompanyId).ToArray();
                }
                else if (index >= 0)
                {
                    activeCompany.Debts[index] = debtResponse.Debt;
                }
                else
                {
                    Debug.LogWarning($"DebtServicingWindow: Updated debt for creditor {debtResponse.Debt.CreditorCompanyId} not found locally; adding it.");
                    activeCompany.Debts = activeCompany.Debts.Append(debtResponse.Debt).ToArray();
                }
            }
            
            RefreshDebtList();
        };

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
        if (paymentInFlight) return;

        var debtVM = companyDebtVMs.FirstOrDefault(t => t.Id == debtId);
        if (debtVM == null) return;

        paymentInFlight = true;
        Client.CallAPI(
            $"/company/{Client.ActiveCompanyId}/debts/{debtVM.CreditorCompanyId}/pay",
            APICallType.Post,
            (success, response) =>
            {
                paymentInFlight = false;

                if (success)
                {
                    var activeCompany = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.ActiveCompanyId);
                    if (activeCompany != null)
                    {
                        activeCompany.Debts = activeCompany.Debts.Where(d => d.CreditorCompanyId != debtVM.CreditorCompanyId).ToArray();
                    }

                    RefreshDebtList();
                    PopupController.ShowPopup("Payment Successful", $"Paid {debtVM.CreditorCompanyName} in full.");
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

    public void RefreshDebtList()
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

        paymentInFlight = false;
        base.Open();

        RefreshDebtList();
    }

    public new void Close()
    {
        base.Close();
    }
}
using TMPro;
using UnityEngine;
using System.Linq;
using System.Collections.Generic;
using System;
using Newtonsoft.Json;

public class PartialPaymentPopup : BaseWindow<PartialPaymentPopup>
{
    private TMP_InputField inputField;
    private UIActionController actionController;
    private string creditorCompanyId;
    private float maxAmount;
    private bool paymentInFlight;

    public Action<CompanyDebtPaymentResponse> OnPaymentSucceeded;

    protected override void Awake()
    {
        inputField = GetComponentInChildren<TMP_InputField>();

        if(inputField == null)
        {
            throw new NullReferenceException("PartialPaymentPopup: No TMP_InputField found in children");
        }

        base.Awake();
    }

    private void PayDebtPartially(string debtId, decimal amount)
    {
        if (paymentInFlight) return;

        Debug.Log("Sending debt amount to pay: " + amount);

        paymentInFlight = true;
        Client.CallAPI(
            $"/company/{Client.ActiveCompanyId}/debts/{creditorCompanyId}/pay",
            APICallType.Post,
            (success, response) =>
            {
                paymentInFlight = false;

                if (success)
                {
                    CompanyDebtPaymentResponse debtResponse = null;
                    try
                    {
                        debtResponse = JsonConvert.DeserializeObject<CompanyDebtPaymentResponse>(response);
                    }
                    catch (JsonException e)
                    {
                        Debug.LogError($"Failed to parse updated debt from payment response: {e.Message}");
                    }

                    OnPaymentSucceeded?.Invoke(debtResponse);

                    if ((float)amount > maxAmount)
                    {
                        PopupController.ShowPopup("Payment Successful", $"Amount was greater than the remaining debt, so only {Math.Min((float)amount,maxAmount):C} was sent.");
                    }
                    else
                    {
                        PopupController.ShowPopup("Payment Successful", $"Payment of {amount:C} sent.");
                    }
                }
                else
                {
                    Debug.LogError($"Failed to pay debt {debtId} partially: {response}");
                    PopupController.ShowPopup("Payment Failed", Utils.ExtractErrorMessage(response));
                }
                Close();
            },
            JsonConvert.SerializeObject(new { amount })
        );
    }

    public override bool Open()
    {
        paymentInFlight = false;
        return base.Open();
    }

    public bool Setup(string companyName, string creditorCompanyId, string debtId, float maxAmount)
    {
        this.creditorCompanyId = creditorCompanyId;
        this.maxAmount = maxAmount;

        var texts = GetComponentsInChildren<TextMeshProUGUI>();
        var titleText = texts.FirstOrDefault(t => t.name == "txWindowTitle");
        var messageText = texts.FirstOrDefault(t => t.name == "txPromptBody");

        if(titleText != null)
        {
            titleText.text = $"Partial Payment to {companyName}";
        }
        else
        {
            Debug.LogError("PartialPaymentPopup: TextMeshProUGUI with name 'txWindowTitle' not found in children.");
            return false;
        }

        if(messageText != null)
        {
            messageText.text = $"Please enter an amount. This will be deducted from your company's funds and sent to {companyName}. If you don't have enough money, sell some assets or complete a contract.";
        }
        else
        {
            Debug.LogError("PartialPaymentPopup: TextMeshProUGUI with name 'txPromptBody' not found in children.");
            return false;
        }

        actionController = GetComponent<UIActionController>();
        if(actionController == null)
        {
            Debug.LogError("Prompt prototype must have a UIActionController component");
            return false;
        }
        actionController.LoadActions(new List<UIItemAction>(){
            new UIItemAction(){
                Name = "Pay",
                Callback = (id) => {
                    if (decimal.TryParse(inputField.text, out decimal amount) && amount > 0)
                    {
                        PayDebtPartially(debtId, amount);
                    }
                    else
                    {
                        PopupController.ShowPopup("Invalid Amount", "Please enter a valid payment amount.");
                    }
                }
            } ,new UIItemAction(){
                Name = "Cancel",
                Callback = (id) => Close()
            } });

        return true;
    }
}
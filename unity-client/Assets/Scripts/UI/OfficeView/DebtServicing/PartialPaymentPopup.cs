using TMPro;
using UnityEngine;
using System.Linq;
using System.Collections.Generic;
using System;

public class PartialPaymentPopup : BaseWindow<PartialPaymentPopup>
{
    private TMP_InputField inputField;
    private UIActionController actionController;

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
        Debug.Log($"paying debt {debtId} partially: {amount}");
        /*Client.CallAPI("/company/pay-debt-partially",APICallType.Post,(success,response) =>
        {
            if (!success) {
                Debug.LogError(response);
                Debug.LogError($"Failed to pay debt {debtId} partially: {response}");
            }   
        },JsonConvert.SerializeObject(new 
        { 
            debtId,
            amount
        }));*/
    }

    public bool Setup(string companyName, string debtId)
    {
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
                Callback = (debtId) => {
                    if (decimal.TryParse(inputField.text, out decimal amount))
                    {
                        PayDebtPartially(debtId, amount);
                    }
                    else
                    {
                        Debug.LogError("Invalid amount entered.");
                    }
                }
            } ,new UIItemAction(){
                Name = "Cancel",
                Callback = (debtId) => Close()
            } });

        return true;
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using TMPro;
using UnityEngine;

public class CreateCompanyPopup : BaseWindow<CreateCompanyPopup>
{
    private TMP_InputField inputField;
    private UIActionController actionController;

    public Action<CompanyDTO> OnCreateCompanySucceeded;

    protected override void Awake()
    {
        inputField = GetComponentInChildren<TMP_InputField>();

        if(inputField == null)
        {
            throw new NullReferenceException("CreateCompanyPopup: No TMP_InputField found in children");
        }

        base.Awake();
    }

    public new void Open()
    {
        if(canvasGroupToggle.IsVisible)
            return;

        var texts = GetComponentsInChildren<TextMeshProUGUI>();
        var titleText = texts.FirstOrDefault(t => t.name == "txWindowTitle");
        var messageText = texts.FirstOrDefault(t => t.name == "txPromptBody");

        if(titleText != null)
        {
            titleText.text = $"Create Company";
        }
        else
        {
            Debug.LogError("CreateCompanyPopup: TextMeshProUGUI with name 'txWindowTitle' not found in children.");
            return ;
        }

        if(messageText != null)
        {
            messageText.text = $"Please enter a name for your new company.";
        }
        else
        {
            Debug.LogError("CreateCompanyPopup: TextMeshProUGUI with name 'txPromptBody' not found in children.");
            return ;
        }

        actionController = GetComponent<UIActionController>();
        if(actionController == null)
        {
            Debug.LogError("CreateCompanyPopup: UIActionController component not found.");
            return ;
        }

        actionController.LoadActions(new List<UIItemAction>(){
            new UIItemAction(){
                Name = "Create",
                Callback = (id) => {
                    if (inputField.text == "")
                    {
                        PopupController.ShowPopup("Invalid Name", "Please enter a valid company name.");
                        return;
                    }

                    Client.CallAPI(
                    $"/company/create",
                    APICallType.Post,
                    (success, response) =>
                    {
                        CompanyDTO newCompany = JsonConvert.DeserializeObject<CompanyDTO>(response);

                        if (success)
                        {
                            PopupController.ShowPopup("Company created", $"You've been promoted to CEO/Founder of ${newCompany.Name}. Welcome back sir.");
                        }
                        else
                        {
                            Debug.LogError($"Failed to create company: {response}");
                            PopupController.ShowPopup("Failed to create company", Utils.ExtractErrorMessage(response));
                        }

                        OnCreateCompanySucceeded?.Invoke(newCompany);

                        Debug.Log("NEW COMPANY="+response);
                    });
                }
            } ,new UIItemAction(){
                Name = "Cancel",
                Callback = (id) => Close()
            } });

        base.Open();
    }
}
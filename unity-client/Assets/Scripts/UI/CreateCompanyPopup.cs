using System;
using System.Collections.Generic;
using System.Linq;
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

    public bool Setup()
    {

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
            return false;
        }

        if(messageText != null)
        {
            messageText.text = $"Please enter a name for your new company.";
        }
        else
        {
            Debug.LogError("CreateCompanyPopup: TextMeshProUGUI with name 'txPromptBody' not found in children.");
            return false;
        }

        actionController = GetComponent<UIActionController>();
        if(actionController == null)
        {
            Debug.LogError("CreateCompanyPopup: UIActionController component not found.");
            return false;
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

                    // create the company
                }
            } ,new UIItemAction(){
                Name = "Cancel",
                Callback = (id) => Close()
            } });

        return true;
    }
}
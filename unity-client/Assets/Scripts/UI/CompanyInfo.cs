using UnityEngine;
using TMPro;
using System.Linq;
using System;

public class CompanyInfo : MonoBehaviour
{
    private TextMeshProUGUI companyNameText;
    private TextMeshProUGUI companyMoneyText;
    private RegulatoryActionPanel regulatoryActionPanel;
    private RegulatoryActionStatus statusTarget = RegulatoryActionStatus.None;

    private Color moneyGreen = new Color(0,1,0.1264467f,1);
    private Color moneyRed = new Color(1,0,0.0611949f,1);

    private float companyMoneyTarget = 0;
    private float companyMoneyCurrent = 0;

    void Start()
    {
        companyNameText = transform.Find("CompanyName").GetComponentInChildren<TextMeshProUGUI>();
        companyMoneyText = transform.Find("txMoney").GetComponent<TextMeshProUGUI>();

        regulatoryActionPanel = transform.Find("RegulatoryAction").GetComponent<RegulatoryActionPanel>();

        if(companyNameText == null)
        {
            Debug.LogError("Company Name TextMeshProUGUI component not found in children.");
        }
        if(companyMoneyText == null)
        {
            Debug.LogError("Company Money TextMeshProUGUI component not found in children.");
        }
        if(regulatoryActionPanel == null)
        {
            Debug.LogError("RegulatoryActionPanel component not found in children.");
        }
    }

    void UpdateCompanyInfo()
    {
        if(Client.ActiveCompanyId == null)
            return;

        var company = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.ActiveCompanyId);

        if(company == null)
        {
            Debug.LogError("Player's company not found in CompanyDTOs.");
            return;
        }

        companyNameText.text = company.Name;

        if(companyMoneyTarget > company.Money)
        {
            companyMoneyText.color = moneyRed;
        }
 
        companyMoneyTarget = company.Money;

        company.RegulatoryActionStatus = statusTarget;
        Debug.Log("company.RegulatoryActionStatus=" + company.RegulatoryActionStatus);

        regulatoryActionPanel.SetStatus(company.RegulatoryActionStatus);
    }

    void Update()
    {
        UpdateCompanyInfo();

        if(companyMoneyCurrent == 0)
            companyMoneyCurrent = companyMoneyTarget;
        else
            companyMoneyCurrent = Mathf.Lerp(companyMoneyCurrent,companyMoneyTarget,Time.deltaTime);

        companyMoneyText.text = companyMoneyCurrent.ToString("C");
        companyMoneyText.color = Color.Lerp(companyMoneyText.color, moneyGreen,Time.deltaTime);

        var company = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.ActiveCompanyId);

        if(company == null)
        {
            Debug.LogError("Player's company not found in CompanyDTOs.");
            return;
        }   

        if(Input.GetKeyDown(KeyCode.Alpha1))
        {
            statusTarget = RegulatoryActionStatus.None;
        }
        if(Input.GetKeyDown(KeyCode.Alpha2))
        {
            statusTarget = RegulatoryActionStatus.PreProbation;
        }
        if(Input.GetKeyDown(KeyCode.Alpha3))
        {
            statusTarget = RegulatoryActionStatus.Probation;
        }
        if(Input.GetKeyDown(KeyCode.Alpha4))
        {
            statusTarget = RegulatoryActionStatus.PreSuspensionNotice;
        }
        if(Input.GetKeyDown(KeyCode.Alpha5))
        {
            statusTarget = RegulatoryActionStatus.SuspensionNotice;
        }
        if(Input.GetKeyDown(KeyCode.Alpha6))
        {
            statusTarget = RegulatoryActionStatus.PreCeasedOperations;
        }
        if(Input.GetKeyDown(KeyCode.Alpha7))
        {
            statusTarget = RegulatoryActionStatus.CeasedOperations;
        }
    }

    public void SwitchCompany(string companyId)
    {
        
    }
}
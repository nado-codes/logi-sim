using UnityEngine;
using TMPro;
using System.Linq;
using System;

public class CompanyInfo : MonoBehaviour
{
    private TextMeshProUGUI companyNameText;
    private TextMeshProUGUI companyMoneyText;

    private float companyMoneyTarget = .1f;
    private float companyMoneyCurrent = 0;

    void Start()
    {
        companyNameText = transform.Find("CompanyName").GetComponentInChildren<TextMeshProUGUI>();
        companyMoneyText = transform.Find("txMoney").GetComponent<TextMeshProUGUI>();

        if(companyNameText == null)
        {
            Debug.LogError("Company Name TextMeshProUGUI component not found in children.");
        }
        if(companyMoneyText == null)
        {
            Debug.LogError("Company Money TextMeshProUGUI component not found in children.");
        }

        UpdateCompanyInfo();
        companyMoneyCurrent = companyMoneyTarget;
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
        companyMoneyTarget = company.Money;
    }

    void Update()
    {
        UpdateCompanyInfo();
        companyMoneyCurrent = Mathf.Lerp(companyMoneyCurrent,companyMoneyTarget,Time.deltaTime);

        companyMoneyText.text = companyMoneyCurrent.ToString("C");
    }

    public void SwitchCompany(string companyId)
    {
        
    }
}
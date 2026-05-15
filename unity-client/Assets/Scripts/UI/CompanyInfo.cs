using UnityEngine;
using TMPro;
using System.Linq;

public class CompanyInfo : MonoBehaviour
{
    private TextMeshProUGUI companyNameText;
    private TextMeshProUGUI companyMoneyText;

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
    }

    void Update()
    {
        var company = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.PlayerCompanyId);

        if(company == null)
        {
            Debug.LogError("Player's company not found in CompanyDTOs.");
        }

        companyNameText.text = company.Name;
        companyMoneyText.text = company.Money.ToString("C");
    }

    public void SwitchCompany(string companyId)
    {
        
    }
}
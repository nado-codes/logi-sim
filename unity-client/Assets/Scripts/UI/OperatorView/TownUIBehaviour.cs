using UnityEngine;
using TMPro;

[RequireComponent(typeof(Canvas))]
public class TownUIBehaviour : MonoBehaviour
{
    private int targetPopulation = 0;
    private float currentPopulation = 0;

    private Canvas canvas;

    void Start()
    {
        canvas = GetComponent<Canvas>();
        if (canvas == null)
        {
            Debug.LogError("TownUIBehaviour requires a Canvas component.");
        }
    }


    void Update()
    {
        var town = Client.TownDTOs.Find(town => town.Id == transform.parent.gameObject.name);
        if (town != null)
        {
            var txName = transform.Find("txName").GetComponent<TextMeshProUGUI>();
            txName.text = town.Name;

            var txCompanyName = transform.Find("txCompanyName").GetComponent<TextMeshProUGUI>();
            txCompanyName.text = town.CompanyId != null ? Client.CompanyDTOs.Find(company => company.Id == town.CompanyId)?.Name : "Unknown Company";

            var population = transform.Find("Population");
            var txPopulation = population.Find("txPopulation").GetComponent<TextMeshProUGUI>();

            targetPopulation = town.Population;

            if(currentPopulation == 0)
                currentPopulation = targetPopulation;
            else
                currentPopulation = (targetPopulation-currentPopulation) > .1f? Mathf.Lerp(currentPopulation, targetPopulation, Time.deltaTime * 0.1f) : targetPopulation;

            txPopulation.text = currentPopulation > 999 ? (currentPopulation / 1000).ToString("0.0") + "K" : currentPopulation.ToString("N0");
        }
    }
}
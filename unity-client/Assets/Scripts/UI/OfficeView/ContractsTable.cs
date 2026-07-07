using UnityEngine;
using System;
using TMPro;

public class ContractsTable : UITable
{
    protected override void loadDataToItem<T>(T data, GameObject item)
    {
        Debug.Log("DID THE THING");
        base.loadDataToItem(data, item);

        if (data is ContractViewModel contract)
        {
            var deliveredTotalText = contract.DeliveredAmount + " / " + contract.TotalAmount.Replace(",", "");
            var deliveredCell = item.transform.Find("DeliveredVsTotalCell")?.GetComponentInChildren<TextMeshProUGUI>();
            if (deliveredCell != null)
            {
                deliveredCell.text = deliveredTotalText;
            }
            else
            {
                Debug.LogError("ContractsTable: Could not find 'DeliveredVsTotalCell' TextMeshProUGUI in itemPrototype");
            }
        }
    }
}
using UnityEngine;
using System;
using TMPro;
using System.Collections.Generic;
using System.Linq;
using UnityEngine.UI;

public class ContractsTable : UITable
{
    protected override void loadDataToItem<T>(T data, GameObject item)
    {
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

    protected override void loadActionsToItem(GameObject item, List<UIItemAction> actions)
    {
        base.loadActionsToItem(item, actions);
        var actionButtons = getActionButtons(item);
        var acceptContractAction = actionButtons.FirstOrDefault(b => b.name == "AcceptActionButton");

        if(acceptContractAction != null)
        {
            var activeCompany = Client.CompanyDTOs.FirstOrDefault(c => c.Id == Client.ActiveCompanyId);
            acceptContractAction.interactable = !activeCompany.IsInsolvent;
        }
    }
}
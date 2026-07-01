using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;

public class ContractList : UIList
{
    private UIProgressBar prgDelivered, prgDeadline;
    protected override void Start()
    {
        base.Start();

        prgDelivered = itemPrototype.transform.Find("prgDelivered")?.GetComponent<UIProgressBar>();
        if (prgDelivered == null)
        {
            Debug.LogError("ContractList: Could not find 'prgDelivered' UIProgressBar in itemPrototype");
        }
        prgDeadline = itemPrototype.transform.Find("prgDeadline")?.GetComponent<UIProgressBar>();
        if (prgDeadline == null)
        {
            Debug.LogError("ContractList: Could not find 'prgDeadline' UIProgressBar in itemPrototype");
        }
    }

    protected override void loadDataToItem<T>(T item, GameObject listItem)
    {
        base.loadDataToItem(item, listItem); // handles tx_ text fields as normal
        
        if (item is ContractViewModel contract)
        {
            var deliveredProgress = float.Parse(contract.DeliveredAmount) / float.Parse(contract.TotalAmount);
            prgDelivered.SetProgress(deliveredProgress);

            var expectedTick = int.Parse(contract.ExpectedTick.Replace("Tick ", ""));
            var deadlineProgress = Client.WorldTick / (float)expectedTick;
            prgDeadline.SetProgress(deadlineProgress);
        }
    }

    protected override void loadActionsToItem(GameObject item, List<UIItemAction> actions)
    {
        throw new NotImplementedException();
    }
}
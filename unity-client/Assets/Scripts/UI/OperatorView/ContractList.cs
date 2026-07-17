using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;

public class ContractList : UIList
{
    protected override void Start()
    {
        base.Start();

        var availableContractDTOs = Client.ContractDTOs.Where(dto => dto.AcceptedAtTick == null);
        var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
        Populate(contractVMs.ToList(),(contractId) => new List<UIItemAction>());
    }

    void Update()
    {
        var availableContractDTOs = Client.ContractDTOs.Where(dto => dto.AcceptedAtTick == null);
        var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
        Refresh(contractVMs.ToList());
    }

    protected override void loadDataToItem<T>(T item, GameObject listItem)
    {
        base.loadDataToItem(item, listItem); // handles tx_ text fields as normal
        
        if (item is ContractViewModel contract)
        {
            var txSupplierDestination = listItem.transform.Find("txSupplierDestination")?.GetComponent<TextMeshProUGUI>();
            
            var prgDelivered = listItem.transform.Find("prgDelivered")?.GetComponent<UIProgressBar>();
            var prgDeadline = listItem.transform.Find("prgDeadline")?.GetComponent<UIProgressBar>();

            if (txSupplierDestination == null)
            {
                Debug.LogError("ContractList: Could not find 'txSupplierDestination' TextMeshProUGUI in itemPrototype");
            }

            if (prgDelivered == null)
            {
                Debug.LogError("ContractList: Could not find 'prgDelivered' UIProgressBar in itemPrototype");
            }
            if (prgDeadline == null)
            {
                Debug.LogError("ContractList: Could not find 'prgDeadline' UIProgressBar in itemPrototype");
            }

            txSupplierDestination.text = $"{contract.SupplierName} → {contract.DestinationName}";

            var deliveredProgress = float.Parse(contract.DeliveredAmount) / float.Parse(contract.TotalAmount);
            prgDelivered.SetProgress(deliveredProgress);

            var expectedTick = int.Parse(contract.ExpectedTick.Replace("Tick ", ""));
            var deadlineProgress = Client.WorldTick / (float)expectedTick;
            prgDeadline.SetProgress(deadlineProgress);
        }
    }
}
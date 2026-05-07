using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

public class ContractsWindow : BaseWindow<ContractsWindow>
{
    private UITable table;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    protected override void Start()
    {
        base.Start();
        table = GetComponentInChildren<UITable>();
        Close();
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    private IEnumerator populateContracts()
    {
        var contractsRequest = UnityWebRequest.Get(Client.BaseUrl + "/world/contracts");
        yield return contractsRequest.SendWebRequest();

        if(contractsRequest.result == UnityWebRequest.Result.Success)
        {
            var contractDTOS = JsonConvert.DeserializeObject<List<ContractDTO>>(contractsRequest.downloadHandler.text);
            var availableContractDTOs = contractDTOS.Where(dto => dto.AcceptedAtTick == null);
            Debug.Log("availableContractDTOs="+JsonConvert.SerializeObject(availableContractDTOs));
            var contractVMs = availableContractDTOs.Select(dto => ContractViewModel.FromDTO(dto,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));
            table.Populate(contractVMs,new List<RowAction>());
        }

        
    }

    public new void Open()
    {
        base.Open();
        StartCoroutine(populateContracts());
    }
}

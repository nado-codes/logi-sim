using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

public class AITrainer : MonoBehaviour
{
    private const string BaseUrl = "http://localhost:3001/api";
    private static AITrainer instance;

    private bool teachContracts = true;
    private bool teachDispatch = false;
    private bool teachFleetManagement = false;
    private bool teachIndustryManagement = false;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        if (instance == null)
        {
            instance = this;
        }
        else
        {
            Destroy(gameObject);
        }

        StartCoroutine(PollServerState());
    }

    IEnumerator PollServerState()
    {
        while (true)
        {
            var contractsRequest = UnityWebRequest.Get(BaseUrl + "/world/contracts");
            yield return contractsRequest.SendWebRequest();

            if (contractsRequest.result == UnityWebRequest.Result.Success)
            {
                var contractDTOs = JsonConvert.DeserializeObject<List<ContractDTO>>(contractsRequest.downloadHandler.text);

                Debug.Log("There are " + contractDTOs.Count + " contracts: ");
                foreach (ContractDTO contractDTO in contractDTOs)
                {
                    Debug.Log(JsonConvert.SerializeObject(contractDTO));
                }

            }

            yield return new WaitForSeconds(.5f); // Wait for 0.5 seconds before the next teaching cycle
        }
    }

    // Update is called once per frame
    void Update()
    {

    }
}

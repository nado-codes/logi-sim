using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;
using TMPro;
using UnityEngine.Networking;
using System;

public class AITrainer : MonoBehaviour
{
    private static AITrainer instance;

    private enum EventType
    {
        None,
        Welcome,
        NewContract,
    }

    // User-controlled tutorial toggles
    private bool canWelcome = false;
    private bool canTeachContracts = true;
    private bool canTeachDispatch = false;
    private bool canTeachFleetManagement = false;
    private bool canTeachIndustryManagement = false;
    private bool isActive = false;

    private List<ContractDTO> contractDTOs = new List<ContractDTO>();
    private TextMeshProUGUI txMessage;
    private CanvasGroup canvasGroup;

    private string[] pages;

    private int page = 0;

    // Welcome flow messages
    private const string welcomeMessages = @"Alright, since it's your first time here, we'll start you off with the basics. You'll see the seniors running around doing lots of things: Dispatching trucks, talking on the phone with our industry guys to make sure the production lines are running etc. Don't worry about that stuff for now though. Boss has asked me to walk you through how we get contracts. Because at the end of the day, that's what we're here for. We haul stuff around and get paid for it. Contracts usually come in pretty quickly. I'll let you know when one pops up, and we can go through it together.";


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

        canvasGroup = GetComponent<CanvasGroup>();

        if (!canvasGroup)
        {
            Debug.LogError("AITrainer: Could not find CanvasGroup component");
        }

        canvasGroup.alpha = 0; // Start invisible

        txMessage = transform.Find("txMessage")?.GetComponent<TextMeshProUGUI>();

        if (!txMessage)
        {
            Debug.LogError("AITrainer: Could not find txMessage TextMeshProUGUI component in children");
        }

        txMessage.text = "";

        StartCoroutine(CheckForNewContracts());

        if (canWelcome)
        {
            pages = paginateMessages(welcomeMessages);
            txMessage.text = pages[page];
            isActive = true;
        }
    }

    IEnumerator processEvent(string situation, string contextJSON)
    {
        if(isActive)
        {
            yield break;
        }

        var data = new Dictionary<string,string>()
        {
            {"situation",situation},
            {"context",contextJSON}
        };
        var dialogueRequest = UnityWebRequest.Post(Client.BaseUrl + "/ai/dialogue",JsonConvert.SerializeObject(data),"application/json");
        yield return dialogueRequest.SendWebRequest();

        if (dialogueRequest.result == UnityWebRequest.Result.Success)
        {
            var response = JsonConvert.DeserializeObject<Dictionary<string,string>>(dialogueRequest.downloadHandler.text);
            pages = paginateMessages(response["dialogue"]);
            isActive = true;
        txMessage.text = pages[page];
        }
        else
        {
            Debug.LogError("Failed to process event: "+dialogueRequest.downloadHandler.text);
        } 

        
    }

    string[] paginateMessages(string message, int wordsPerPage = 25)
    {
        string[] words = message.Split(" ");
        List<string> pages = new();
        var cursorOffset = 0;
        var cursor = 0;

        var page = "";
        while (cursor < words.Length)
        {
            if (cursor - cursorOffset < wordsPerPage)
            {
                page += (page.Length > 0 ? " " : "") + words[cursor];
                cursor++;
            }
            else
            {
                pages.Add($"{page}...");

                cursorOffset += wordsPerPage;
                page = "";
            }
        }

        pages.Add(page);

        return pages.ToArray();
    }

    public void nextMessage()
    {
        if (page < pages.Length - 1)
        {
            page++;
            txMessage.text = pages[page];
        }
        else
        {
            page = 0;
            isActive = false;
        }
    }

    IEnumerator CheckForNewContracts()
    {
        while (true)
        {
            try{
                var newContractDTOs = Client.ContractDTOs.FindAll(updated => !contractDTOs.Exists(existing => existing.Id == updated.Id) && updated.AcceptedAtTick == null && updated.DeliveredTick == null);
                var newContractVMs = newContractDTOs.Select(c => ContractViewModel.FromDTO(c,Client.CompanyDTOs,Client.LocationDTOs,Client.TruckDTOs,Client.WorldTick));

                if (newContractDTOs.Any() && canTeachContracts)
                {
                    StartCoroutine(processEvent("A new contract has come in. Need to know if it's good or not. Not interested in the truck name, or whether it was accepted or delivered.",JsonConvert.SerializeObject(newContractVMs)));
                }

                contractDTOs = Client.ContractDTOs;
            }
            catch(Exception err)
            {
                Debug.LogError(err);
            }

            yield return new WaitForSeconds(.5f);
        }
    }

    void Update()
    {
        if (!isActive)
        {
            canvasGroup.alpha = Mathf.Lerp(canvasGroup.alpha, 0, Time.deltaTime * 3);
        }
        else
        {
            canvasGroup.alpha = Mathf.Lerp(canvasGroup.alpha, 1, Time.deltaTime * 3);
        }
    }
}

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
    private const string BaseUrl = "http://localhost:3001/api";
    private static AITrainer instance;

    private enum TutorialType
    {
        None,
        Welcome,
        Contracts,
        Dispatch,
        FleetManagement,
        IndustryManagement
    }
    struct TutorialMessage<T> where T : Enum
    {
        public T MessageType;
        public string Message;
    }

    // User-controlled tutorial toggles
    private bool canWelcome = true;
    private bool canTeachContracts = true;
    private bool canTeachDispatch = false;
    private bool canTeachFleetManagement = false;
    private bool canTeachIndustryManagement = false;
    private bool isTeaching = false;

    private List<ContractDTO> contractDTOs = new List<ContractDTO>();
    private TextMeshProUGUI txMessage;
    private CanvasGroup canvasGroup;

    private TutorialType currentTutorial;
    private string[] pages;

    private int page = 0;

    private enum WelcomeMessageType
    {
        None
    }

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

        StartCoroutine(PollServerState());

        if (canWelcome)
        {
            startTutorial(TutorialType.Welcome);
        }
    }

    void startTutorial(TutorialType type)
    {
        Debug.Log("Starting tutorial: " + type);
        if (isTeaching)
        {
            Debug.LogWarning(" - Already teaching" + currentTutorial + ", cannot start a new one");
            return;
        }
        Debug.Log("Started tutorial: " + type);
        isTeaching = true;
        currentTutorial = type;

        page = 0;
        pages = paginateMessages(welcomeMessages);
        txMessage.text = pages[page];
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
        }
        else
        {
            isTeaching = false;
            currentTutorial = TutorialType.None;
        }

        txMessage.text = pages[page];
    }

    IEnumerator PollServerState()
    {
        while (true)
        {
            var contractsRequest = UnityWebRequest.Get(BaseUrl + "/world/contracts");
            yield return contractsRequest.SendWebRequest();

            if (contractsRequest.result == UnityWebRequest.Result.Success)
            {
                var updatedContractDTOs = JsonConvert.DeserializeObject<List<ContractDTO>>(contractsRequest.downloadHandler.text);

                var newContractDTOs = updatedContractDTOs.FindAll(updated => !contractDTOs.Exists(existing => existing.Id == updated.Id));

                if (newContractDTOs.Any())
                {
                    startTutorial(TutorialType.Contracts);
                }

                contractDTOs = updatedContractDTOs;
            }

            yield return new WaitForSeconds(.5f); // Wait for 0.5 seconds before the next teaching cycle
        }
    }

    // Update is called once per frame
    void Update()
    {
        if (!isTeaching)
        {
            canvasGroup.alpha = Mathf.Lerp(canvasGroup.alpha, 0, Time.deltaTime * 3); // Fade out when not teaching
        }
        else
        {
            canvasGroup.alpha = Mathf.Lerp(canvasGroup.alpha, 1, Time.deltaTime); // Fade in when teaching
        }
    }
}

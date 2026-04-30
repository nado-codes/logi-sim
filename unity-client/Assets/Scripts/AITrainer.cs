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
    private int flowStep = 0;

    private enum WelcomeMessageType
    {
        None
    }

    // Welcome flow messages
    private List<TutorialMessage<WelcomeMessageType>> welcomeMessages = new List<TutorialMessage<WelcomeMessageType>>()
    {
        new TutorialMessage<WelcomeMessageType> { MessageType = WelcomeMessageType.None, Message = "Alright, since it's your first time here, we'll start you off with the basics." },
        new TutorialMessage<WelcomeMessageType> { MessageType = WelcomeMessageType.None, Message = "You'll see the seniors running around doing lots of things ... " },
        new TutorialMessage<WelcomeMessageType> { MessageType = WelcomeMessageType.None, Message = "...Dispatching trucks, talking on the phone with our industry guys to make sure the production lines are running etc" },
        new TutorialMessage<WelcomeMessageType> { MessageType = WelcomeMessageType.None, Message = "Don't worry about that stuff for now though. Boss has asked me to walk you through how we get contracts..." },
         new TutorialMessage<WelcomeMessageType> { MessageType = WelcomeMessageType.None, Message = "Because at the end of the day, that's what we're here for. We haul stuff around and get paid for it." },
        new TutorialMessage<WelcomeMessageType> { MessageType = WelcomeMessageType.None, Message = "Contracts usually come in pretty quickly. I'll let you know when one pops up, and we can go through it together." }
    };

    // Contract tutorial events
    private enum ContractMessageType
    {
        NewContract
    }

    private List<TutorialMessage<ContractMessageType>> contractFlowEvents = new List<TutorialMessage<ContractMessageType>>()
    {
        new TutorialMessage<ContractMessageType> { MessageType = ContractMessageType.NewContract, Message = "Alright, we've got some new contracts coming in" }
    };

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

        flowStep = 0;
        txMessage.text = getTutorialMessage(currentTutorial, flowStep);
    }

    string getTutorialMessage(TutorialType type, int step)
    {
        switch (type)
        {
            case TutorialType.Welcome:
                return welcomeMessages[step].Message;
            case TutorialType.Contracts:
                return contractFlowEvents[step].Message;
            default:
                return null;
        }
    }

    int getTutorialMessageCount(TutorialType type)
    {
        switch (type)
        {
            case TutorialType.Welcome:
                return welcomeMessages.Count;
            case TutorialType.Contracts:
                return contractFlowEvents.Count;
            default:
                return 0;
        }
    }

    public void nextMessage()
    {
        if (flowStep < getTutorialMessageCount(currentTutorial) - 1)
        {
            flowStep++;
        }
        else
        {
            isTeaching = false;
            currentTutorial = TutorialType.None;
        }

        txMessage.text = getTutorialMessage(currentTutorial, flowStep);
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
            canvasGroup.alpha = Mathf.Lerp(canvasGroup.alpha, 0, Time.deltaTime); // Fade out when not teaching
        }
        else
        {
            canvasGroup.alpha = Mathf.Lerp(canvasGroup.alpha, 1, Time.deltaTime); // Fade in when teaching
        }
    }
}

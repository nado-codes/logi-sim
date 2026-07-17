using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public enum UIActionOrientation
{
    Horizontal,
    Vertical
}
public class UIActionController : MonoBehaviour
{
    protected Func<string, List<UIItemAction>> actionFactory = (_) => new List<UIItemAction>();
    protected NotificationConfig notificationConfig = Utils.LoadNotificationConfig();

    public GameObject ActionButtonPrototype;
    public int ItemSpacingPx = 5;

    void Start()
    {
        if(!ActionButtonPrototype)
        {
            throw new NullReferenceException("Action button prototype must be set");
        }

        ActionButtonPrototype.SetActive(false);
    }

    public void SetActionFactory(Func<string, List<UIItemAction>> actionFactory)
    {
        if(notificationConfig.logUINotifications.actions.Create)
        {
            Debug.Log("Setting action factory "+JsonConvert.SerializeObject(actionFactory));
        }

        LoadActions(actionFactory(gameObject.name));

        this.actionFactory = actionFactory;
    }

    public GameObject GetActionsCell()
    {
        var actionsCell = transform.GetComponentsInChildren<Transform>().FirstOrDefault(c => c.name == "ActionsCell")?.gameObject;

        if(actionsCell == null)
        {
            Debug.LogError("No action cell found. Make sure there is a cell called \"ActionsCell\"");
            return null;
        }

        return actionsCell;
    }
    public List<Button> GetActionButtons()
    {
        var actionsCell = GetActionsCell();
        if (actionsCell == null)
        {
            return new List<Button>();
        }

        var actionButtons = actionsCell.GetComponentsInChildren<Button>().ToList();

        return actionButtons;
    }

    public void LoadActions(List<UIItemAction> actions)
    {
        var actionButtonGOs = GetActionButtons().Select(b => b.gameObject).ToList();

        foreach(var buttonGO in actionButtonGOs)
        {
            DestroyImmediate(buttonGO);
        }
        actionButtonGOs.Clear();

        foreach(var action in actions)
        {
            var buttonGO = Instantiate(ActionButtonPrototype);
            
            var buttonText = buttonGO.GetComponentInChildren<TextMeshProUGUI>();
            if(!buttonText)            
            {
                Debug.LogError("No TextMeshProUGUI component found in action button prototype");
                DestroyImmediate(buttonGO);
                continue;
            }
            var button = buttonGO.GetComponent<Button>();
            if(!button)
            {
                Debug.LogError("No Button component found in action button prototype");
                DestroyImmediate(buttonGO);
                continue;
            }

            buttonGO.name = action.Name+"ActionButton";
            buttonGO.transform.SetParent(GetActionsCell().transform,true);
            var actionButtonProtoPos = ActionButtonPrototype.GetComponent<RectTransform>().localPosition;
            var actionButtonProtoWidth = ActionButtonPrototype.GetComponent<RectTransform>().sizeDelta.x;
            var actionButtonProtoHeight = ActionButtonPrototype.GetComponent<RectTransform>().sizeDelta.y;

            buttonGO.GetComponent<RectTransform>().localPosition = new Vector3(actionButtonProtoPos.x+((actionButtonProtoWidth+ItemSpacingPx)*actionButtonGOs.Count),0);

            button.onClick.AddListener(() => action.Invoke(gameObject.name));
            buttonText.text = action.Name;
            buttonGO.SetActive(true);
            actionButtonGOs.Add(buttonGO);

            if(notificationConfig.logUINotifications.actions.Create)
            {
                Debug.Log(" - Finished adding action button");
            }
        }
    }
}
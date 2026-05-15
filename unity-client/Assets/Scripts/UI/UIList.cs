using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class UIList : BaseUIDataView
{
    public int spacingPx = 5;

    protected override void Start()
    {
        if(!itemPrototype)
        {
            throw new NullReferenceException("List Item prototype must be set");
        }

        if(!actionButtonPrototype)
        {
            throw new NullReferenceException("List Action Button prototype must be set");
        }

        itemPrototype.SetActive(false);
        actionButtonPrototype.SetActive(false);
    }

    public override void Populate<T>(List<T> dataList,List<UIAction> actions)
    {
        for(var i = 0; i < items.Count; i++)
            deleteItem(items[i]);

        foreach(T data in dataList)
        {
            var listItem = createItem(data);
            loadActionsToItem(listItem, actions);
        }
        SetActions(actions);
    }

    protected override GameObject createItem<T>(T item)
    {
        var listItem = Instantiate(itemPrototype);
        listItem.name = item.Id;

        listItem.transform.SetParent(itemPrototype.transform.parent, false);
        var listItemRect = listItem.GetComponent<RectTransform>();
        var protoHeight = itemPrototype.GetComponent<RectTransform>().sizeDelta.y;
        var protoPos = itemPrototype.GetComponent<RectTransform>().position;
        listItemRect.position = new Vector3(protoPos.x,protoPos.y-((protoHeight+spacingPx)*items.Count));
        listItem.SetActive(true);
        items.Add(listItem);

        loadDataToItem(item,listItem);

        return listItem;
    }

    public override void Refresh<T>(List<T> data)
    {
        foreach(T item in data)
        {
            var listItem = items.Find(r => r.name == item.Id);

            if(listItem == null) {
                listItem = createItem(item);
                loadActionsToItem(listItem, currentActions);
            }

            loadDataToItem(item,listItem);
        }

        var listItemsToDelete = items.Where(listItem => !data.Any(item => item.Id == listItem.name)).ToList();
        foreach(var listItem in listItemsToDelete)
            deleteItem(listItem);
    }

    public override void SetActions(List<UIAction> actions)
    {
        Debug.Log("Setting table actions: "+string.Join(", ", actions.Select(a => a.Name)));
        foreach(var listItem in items) {
            loadActionsToItem(listItem, actions);
        }

        currentActions = actions;
    }

    protected override void deleteItem(GameObject listItemToDelete)
    {
        items.Remove(listItemToDelete);
        DestroyImmediate(listItemToDelete);

        foreach(var listItem in items)
        {
            var index = items.IndexOf(listItem);
            var listItemRect = listItem.GetComponent<RectTransform>();
            var protoHeight = itemPrototype.GetComponent<RectTransform>().sizeDelta.y;
            var protoPos = itemPrototype.GetComponent<RectTransform>().position;
            listItemRect.position = new Vector3(protoPos.x,protoPos.y-((protoHeight+spacingPx)*index));
        }
    }

    protected override void loadDataToItem<T>(T item, GameObject listItem)
    {
        if(item.Id != listItem.name)
        {
            Debug.LogWarning("Item ID updated from "+listItem.name+" to "+item.Id+" - actions will be remapped to new ID");
            listItem.name = item.Id;
            remapItemActions(listItem);
        }

        var listItemFields = listItem.transform.GetComponentsInChildren<TextMeshProUGUI>().Where(t => t.name.Contains("tx"));

        foreach(TextMeshProUGUI field in listItemFields)
        {
            var fieldName = field.name.Substring(field.name.IndexOf("tx")+2);
            var itemProp = item.GetType().GetProperty(fieldName);

            if(itemProp != null)
            {
                var value = itemProp.GetValue(item);
                field.text = value.ToString();
            }
            else
            {
                Debug.LogWarning("No matching property found on item for field "+field.name);
            }
        }

        var unmappedProps = item.GetType().GetProperties().Where(p => !listItemFields.Any(f => f.name.Contains(p.Name))).Select(p => p.Name);
        foreach(var prop in unmappedProps)        {
            Debug.LogWarning("No matching field found in the ListItem for property "+prop);
        }
    }

    protected override void remapItemActions(GameObject listItem)
    {
        var actionButtons = listItem.transform.GetComponentsInChildren<Button>();

        foreach(var button in actionButtons)
        {
            var action = currentActions.FirstOrDefault(a => a.Name+"ActionButton" == button.gameObject.name);

            if(action != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(() => action.Callback(listItem.name));
            }
            else
            {
                Debug.LogError("Could not find action for button "+button.gameObject.name+" when remapping listItem actions");
            }
        }
    }
    
    protected override void loadActionsToItem(GameObject listItem, List<UIAction> actions)
    {
        Debug.Log("Loading actions to listItem "+listItem.name);
        var actionsCell = listItem.transform.GetComponentsInChildren<Transform>().FirstOrDefault(c => c.name == "ActionsCell").gameObject;

        if(actionsCell == null)
        {
            Debug.LogError("No cell found for actions in listItem prefab. Make sure there is a cell with \"Actions\" in its name.");
            return;
        }
        var actionButtonGOs = actionsCell.GetComponentsInChildren<Button>().Select(b => b.gameObject).ToList();

        foreach(var buttonGO in actionButtonGOs)
        {
            DestroyImmediate(buttonGO);
        }
        actionButtonGOs.Clear();

        foreach(var action in actions)
        {
            Debug.Log(" - Adding action "+action.Name+" to listItem "+listItem.name);
            var buttonGO = Instantiate(actionButtonPrototype);
            
            var buttonText = buttonGO.GetComponentInChildren<TextMeshProUGUI>();
            if(!buttonText)            {
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
            buttonGO.transform.SetParent(actionsCell.transform, false);

            button.onClick.AddListener(() => action.Callback(listItem.name));
            buttonText.text = action.Name;
            buttonGO.SetActive(true);
            Debug.Log(" - Finished adding action button");
        }
    }
}
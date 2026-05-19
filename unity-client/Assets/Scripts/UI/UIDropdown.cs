using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public abstract class UIDropdown : BaseUIDataView
{
    private RectTransform panelContainer;
    protected bool isOpen = false;

    protected override void Start()
    {
        base.Start();

        panelContainer = transform.Find("PanelContainer")?.GetComponent<RectTransform>();

        if(!panelContainer)
        {
            throw new NullReferenceException("Can't find PanelContainer on UIDropdown");
        }

        Close();
    }

    protected override GameObject createItem<T>(T data)
    {
        var item = Instantiate(itemPrototype);
        item.name = data.Id;

        item.transform.SetParent(itemPrototype.transform.parent, false);
        var itemRect = item.GetComponent<RectTransform>();
        var protoHeight = itemPrototype.GetComponent<RectTransform>().sizeDelta.y;
        var protoPos = itemPrototype.GetComponent<RectTransform>().position;
        itemRect.position = new Vector3(protoPos.x,protoPos.y-((protoHeight+itemSpacingPx)*items.Count));
        item.SetActive(true);
        items.Add(item);

        loadDataToItem(data,item);

        return item;
    }

    protected override void deleteItem(GameObject itemToDelete)
    {
        items.Remove(itemToDelete);
        DestroyImmediate(itemToDelete);

        foreach(var item in items)
        {
            var index = items.IndexOf(item);
            var itemRect = item.GetComponent<RectTransform>();
            var protoHeight = itemPrototype.GetComponent<RectTransform>().sizeDelta.y;
            var protoPos = itemPrototype.GetComponent<RectTransform>().position;
            itemRect.position = new Vector3(protoPos.x,protoPos.y-((protoHeight+itemSpacingPx)*index));
        }
    }

    protected override void loadActionsToItem(GameObject item, List<UIItemAction> actions)
    {
        if(notificationConfig.logUINotifications.actions.Create)
        {
            Debug.Log("Loading actions to item "+item.name+": "+string.Join(", ", actions.Select(a => a.Name)));
        }

        var actionsCell = item.transform.GetComponentsInChildren<Transform>().FirstOrDefault(c => c.name == "ActionsCell").gameObject;

        if(actionsCell == null)
        {
            Debug.LogError("No cell found for actions in item prefab. Make sure there is a cell with \"Actions\" in its name.");
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
            if(notificationConfig.logUINotifications.actions.Create)
            {
                Debug.Log(" - Adding action "+action.Name+" to item "+item.name);
            }

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

            button.onClick.AddListener(() => action.Invoke(item.name));
            buttonText.text = action.Name;
            buttonGO.SetActive(true);
            if(notificationConfig.logUINotifications.actions.Create)
            {
                Debug.Log(" - Finished adding action button");
            }
        }
    }

    protected override void loadDataToItem<T>(T data, GameObject item)
    {
        if(data.Id != item.name)
        {
            Debug.LogWarning("Item ID updated from "+item.name+" to "+data.Id+" - actions will be remapped to new ID");
            item.name = data.Id;
            remapItemActions(item);
        }

        var itemFields = item.transform.GetComponentsInChildren<TextMeshProUGUI>().Where(t => t.name.Contains("tx"));

        foreach(TextMeshProUGUI field in itemFields)
        {
            var fieldName = field.name.Substring(field.name.IndexOf("tx")+2);
            var itemProp = data.GetType().GetProperty(fieldName);

            if(itemProp != null)
            {
                var value = itemProp.GetValue(data);
                field.text = value.ToString();
            }
            else
            {
                Debug.LogWarning("No matching property found on item for field "+field.name);
            }
        }

        var unmappedProps = data.GetType().GetProperties().Where(p => !itemFields.Any(f => f.name.Contains(p.Name))).Select(p => p.Name);
        foreach(var prop in unmappedProps)        {
            Debug.LogWarning("No matching field found in the item for property "+prop);
        }
    }

    private void sizeToItems()
    {
        var protoHeight = itemPrototype.GetComponent<RectTransform>().sizeDelta.y;
        var updatedHeight = (protoHeight/2+itemSpacingPx)*items.Count;

        panelContainer.sizeDelta = new Vector2(panelContainer.sizeDelta.x,updatedHeight);
    }
    public void Open(string itemId)
    {
        var rectTransform = GetComponent<RectTransform>();
        rectTransform.position = Input.mousePosition;
        gameObject.SetActive(true);
        OnOpen(itemId);
        sizeToItems();
        isOpen = true;
    }

    protected abstract void OnOpen(string itemId);

    public void Close()
    {
        gameObject.SetActive(false);
        isOpen = false;
    }

    
}

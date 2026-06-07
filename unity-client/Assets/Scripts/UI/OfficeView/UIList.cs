using System;
using System.Collections.Generic;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class UIList : BaseUIDataView
{
    protected override GameObject createItem<T>(T item)
    {
        var listItem = Instantiate(itemPrototype);
        listItem.name = item.Id;

        listItem.transform.SetParent(itemPrototype.transform.parent, false);
        var listItemRect = listItem.GetComponent<RectTransform>();
        var protoHeight = itemPrototype.GetComponent<RectTransform>().sizeDelta.y;
        var protoPos = itemPrototype.GetComponent<RectTransform>().position;
        listItemRect.position = new Vector3(protoPos.x,protoPos.y-((protoHeight+itemSpacingPx)*items.Count));
        listItem.SetActive(true);
        items.Add(listItem);

        loadDataToItem(item,listItem);

        return listItem;
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
            listItemRect.position = new Vector3(protoPos.x,protoPos.y-((protoHeight+itemSpacingPx)*index));
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
    protected override void loadActionsToItem(GameObject listItem, List<UIItemAction> actions)
    {
        if(notificationConfig.logUINotifications.actions.Create)
        {
            Debug.Log("Loading actions to listItem "+listItem.name+": "+string.Join(", ", actions.Select(a => a.Name)));
        }

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
            if(notificationConfig.logUINotifications.actions.Create)
            {
                Debug.Log(" - Adding action "+action.Name+" to listItem "+listItem.name);
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

            button.onClick.AddListener(() => action.Invoke(listItem.name));
            buttonText.text = action.Name;
            buttonGO.SetActive(true);
            if(notificationConfig.logUINotifications.actions.Create)
            {
                Debug.Log(" - Finished adding action button");
            }
        }
    }
}
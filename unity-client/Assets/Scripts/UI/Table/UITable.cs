using System;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using System.Linq;
using UnityEngine.UI;


public class UITable : BaseUIDataView
{

    protected override void Start()
    {
        if(!itemPrototype)
        {
            throw new NullReferenceException("Table Row prototype must be set");
        }

        if(!actionButtonPrototype)
        {
            throw new NullReferenceException("Table Action Button prototype must be set");
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
            var row = createItem(data);
            loadActionsToItem(row, actions);
        }
        SetActions(actions);
    }

    protected override GameObject createItem<T>(T item)
    {
        var row = Instantiate(itemPrototype);
        row.name = item.Id;

        row.transform.SetParent(itemPrototype.transform.parent, false);
        var rowRect = row.GetComponent<RectTransform>();
        var protoHeight = itemPrototype.GetComponent<RectTransform>().sizeDelta.y;
        var protoPos = itemPrototype.GetComponent<RectTransform>().position;
        rowRect.position = new Vector3(protoPos.x,protoPos.y-(protoHeight*items.Count));
        row.SetActive(true);
        items.Add(row);

        loadDataToItem(item,row);

        return row;
    }

    public override void Refresh<T>(List<T> data)
    {
        foreach(T item in data)
        {
            var row = items.Find(r => r.name == item.Id);

            if(row == null) {
                row = createItem(item);
                loadActionsToItem(row, currentActions);
            }

            loadDataToItem(item,row);
        }

        var rowsToDelete = items.Where(row => !data.Any(item => item.Id == row.name)).ToList();
        foreach(var row in rowsToDelete)
            deleteItem(row);
    }

    public override void SetActions(List<UIAction> actions)
    {
        Debug.Log("Setting table actions: "+string.Join(", ", actions.Select(a => a.Name)));
        foreach(var row in items) {
            loadActionsToItem(row, actions);
        }

        currentActions = actions;
    }

    protected override void deleteItem(GameObject rowToDelete)
    {
        items.Remove(rowToDelete);
        DestroyImmediate(rowToDelete);

        foreach(var row in items)
        {
            var index = items.IndexOf(row);
            var rowRect = row.GetComponent<RectTransform>();
            var protoHeight = itemPrototype.GetComponent<RectTransform>().sizeDelta.y;
            var protoPos = itemPrototype.GetComponent<RectTransform>().position;
            rowRect.position = new Vector3(protoPos.x,protoPos.y-(protoHeight*index));
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
        
        var rowCells = item.transform.GetComponentsInChildren<Transform>().Select(t => t.gameObject).Where(go => go.name.Contains("Cell") && !go.name.Contains("Actions")).ToList();
            
        foreach(GameObject cell in rowCells)
        {
            var cellName = cell.name.Substring(0,cell.name.IndexOf("Cell"));
            var itemProp = data.GetType().GetProperty(cellName);

            if(itemProp != null)
            {
                var value = itemProp.GetValue(data);
                var cellText = cell.GetComponentInChildren<TextMeshProUGUI>();

                if(cellText == null)
                {
                    Debug.LogError("Found a matching value for \""+itemProp.Name+"\", but no cell to insert it into");
                    continue;
                }

                cellText.text = value.ToString();
            }
            else
            {
                Debug.LogWarning("No matching property found on item for cell "+cell.name);
            }
        }
    }

    protected override void remapItemActions(GameObject item)
    {
        var actionButtons = item.transform.GetComponentsInChildren<Button>();

        foreach(var button in actionButtons)
        {
            var action = currentActions.FirstOrDefault(a => a.Name+"ActionButton" == button.gameObject.name);

            if(action != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(() => action.Callback(item.name));
            }
            else
            {
                Debug.LogError("Could not find action for button "+button.gameObject.name+" when remapping row actions");
            }
        }
    }
    
    protected override void loadActionsToItem(GameObject item, List<UIAction> actions)
    {
        Debug.Log("Loading actions to item "+item.name);
        var actionsCell = item.transform.GetComponentsInChildren<Transform>().FirstOrDefault(c => c.name == "ActionsCell").gameObject;

        if(actionsCell == null)
        {
            Debug.LogError("No cell found for actions in row prefab. Make sure there is a cell with \"Actions\" in its name.");
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
            Debug.Log(" - Adding action "+action.Name+" to item "+item.name);
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
            button.onClick.AddListener(() => action.Callback(item.name));
            buttonText.text = action.Name;
            buttonGO.SetActive(true);
            Debug.Log(" - Finished adding action button");
        }
    }

    
}

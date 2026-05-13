using System;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using System.Linq;
using UnityEngine.UI;

public class RowAction
{
    public string Name;
    public Action<string> Callback;
}
public class UITable : MonoBehaviour
{
    public GameObject rowPrototype;
    public GameObject actionButtonPrototype;

    private List<GameObject> rows = new List<GameObject>();
    private List<RowAction> currentActions = new List<RowAction>();

    void Start()
    {
        if(!rowPrototype)
        {
            throw new NullReferenceException("Table Row prototype must be set");
        }

        if(!actionButtonPrototype)
        {
            throw new NullReferenceException("Table Action Button prototype must be set");
        }

        rowPrototype.SetActive(false);
        actionButtonPrototype.SetActive(false);
    }

    public void Populate<T>(List<T> items,List<RowAction> actions)  where T: BaseCompanyEntityViewModel
    {
        for(var i = 0; i < rows.Count; i++)
            deleteRow(rows[i]);

        foreach(T item in items)
        {
            var row = CreateRow(item);
            loadActionsToRow(row, actions);
        }
        SetActions(actions);
    }

    private GameObject CreateRow<T>(T item) where T: BaseCompanyEntityViewModel
    {
        var row = Instantiate(rowPrototype);
        row.name = item.Id;

        row.gameObject.transform.SetParent(rowPrototype.transform.parent, false);
        var rowRect = row.GetComponent<RectTransform>();
        var protoHeight = rowPrototype.GetComponent<RectTransform>().sizeDelta.y;
        var protoPos = rowPrototype.GetComponent<RectTransform>().position;
        rowRect.position = new Vector3(protoPos.x,protoPos.y-(protoHeight*rows.Count));
        row.SetActive(true);
        rows.Add(row);

        loadItemToRow(item,row);

        return row;
    }

    public void Refresh<T>(List<T> items)  where T: BaseCompanyEntityViewModel
    {
        foreach(T item in items)
        {
            var row = rows.Find(r => r.name == item.Id);

            if(row == null) {
                row = CreateRow(item);
            }

            loadItemToRow(item,row);
        }

        var rowsToDelete = rows.Where(row => !items.Any(item => item.Id == row.name)).ToList();
        foreach(var row in rowsToDelete)
            deleteRow(row);
    }

    public void SetActions(List<RowAction> actions)
    {
        Debug.Log("Setting table actions: "+string.Join(", ", actions.Select(a => a.Name)));
        foreach(var row in rows) {
            loadActionsToRow(row, actions);
        }

        currentActions = actions;
    }

    private void deleteRow(GameObject rowToDelete)
    {
        rows.Remove(rowToDelete);
        DestroyImmediate(rowToDelete);

        foreach(var row in rows)
        {
            var index = rows.IndexOf(row);
            var rowRect = row.GetComponent<RectTransform>();
            var protoHeight = rowPrototype.GetComponent<RectTransform>().sizeDelta.y;
            var protoPos = rowPrototype.GetComponent<RectTransform>().position;
            rowRect.position = new Vector3(protoPos.x,protoPos.y-(protoHeight*index));
        }
    }

    private void loadItemToRow<T>(T item, GameObject row) where T: BaseCompanyEntityViewModel
    {
        var rowCells = row.transform.GetComponentsInChildren<Transform>().Select(t => t.gameObject).Where(go => go.name.Contains("Cell") && !go.name.Contains("Actions")).ToList();

        if(item.Id != row.name)
        {
            Debug.LogWarning("Item ID updated from "+row.name+" to "+item.Id+" - actions will be remapped to new ID");
            row.name = item.Id;
            remapRowActions(row);
        }
            
        foreach(GameObject cell in rowCells)
        {
            var cellName = cell.name.Substring(0,cell.name.IndexOf("Cell"));
            var itemProp = item.GetType().GetProperty(cellName);

            if(itemProp != null)
            {
                var value = itemProp.GetValue(item);
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

    private void remapRowActions(GameObject row)
    {
        var actionButtons = row.transform.GetComponentsInChildren<Button>();

        foreach(var button in actionButtons)
        {
            var action = currentActions.FirstOrDefault(a => a.Name+"ActionButton" == button.gameObject.name);

            if(action != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(() => action.Callback(row.name));
            }
            else
            {
                Debug.LogError("Could not find action for button "+button.gameObject.name+" when remapping row actions");
            }
        }
    }
    
    private void loadActionsToRow(GameObject row, List<RowAction> actions)
    {
        Debug.Log("Loading actions to row "+row.name);
        var actionsCell = row.transform.GetComponentsInChildren<Transform>().FirstOrDefault(c => c.name == "ActionsCell").gameObject;

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
            Debug.Log(" - Adding action "+action.Name+" to row "+row.name);
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
            button.onClick.AddListener(() => action.Callback(row.name));
            buttonText.text = action.Name;

            buttonGO.SetActive(true);
            Debug.Log(" - Finished adding action button");
        }
    }

    
}

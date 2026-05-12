using System;
using System.Collections.Generic;
using System.Reflection;
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
    private List<GameObject> rows = new List<GameObject>();
    private List<RowAction> standardActions = new List<RowAction>();

    void Start()
    {
        if(!rowPrototype)
        {
            throw new NullReferenceException("Table Row prototype must be set");
        }

        rowPrototype.SetActive(false);
    }
    void Update()
    {
        
    }

    public void Populate<T>(List<T> items,List<RowAction> actions)  where T: BaseCompanyEntityViewModel
    {
        foreach(T item in items)
        {
            var row = rows.FirstOrDefault(r => r.name == item.Id) ?? CreateRow(item, actions);
            LoadItemToRow(item,row);
        }
        standardActions = actions;
    }

    private GameObject CreateRow<T>(T item, List<RowAction> actions) where T: BaseCompanyEntityViewModel
    {
        var row = Instantiate(rowPrototype);
        row.name = item.GetType().GetProperty("Id").GetValue(item).ToString();

        row.gameObject.transform.SetParent(rowPrototype.transform.parent, false);
        var rowRect = row.GetComponent<RectTransform>();
        var protoHeight = rowPrototype.GetComponent<RectTransform>().sizeDelta.y;
        var protoPos = rowPrototype.GetComponent<RectTransform>().position;
        rowRect.position = new Vector3(protoPos.x,protoPos.y-(protoHeight*rows.Count));
        row.SetActive(true);

        var rowCells = row.transform.GetComponentsInChildren<Transform>().Select(t => t.gameObject).Where(go => go.name.Contains("Cell"));
        var actionsCell = rowCells.FirstOrDefault(c => c.name.Contains("Actions"));

        if(actionsCell == null)
        {
            Debug.LogError("No cell found for actions in row prefab. Make sure there is a cell with \"Actions\" in its name.");
            return row;
        }
        var actionButtonGOs = actionsCell.GetComponentsInChildren<Button>().Select(b => b.gameObject).ToList();

        foreach(var buttonGO in actionButtonGOs)
        {
            var action = actions.FirstOrDefault(a => a.Name == buttonGO.name.Substring(0,buttonGO.name.IndexOf("Action")));
            
            if(action != null)
            {
                var button = buttonGO.GetComponent<Button>();
                if(button == null)
                {
                    Debug.LogError($"GameObject {buttonGO.name} in Actions cell has no Button component");
                    continue;
                }
                button.onClick.AddListener(() => action.Callback(item.Id));
            }
            else
            {
                Debug.LogWarning($"No action found for button {buttonGO.name} in row {rows.Count}");
            }
        }

        if(actions.Any(a => actionButtonGOs.FirstOrDefault(b => b.name.Substring(0,b.name.IndexOf("Action")) == a.Name) == null))
        {
            Debug.LogWarning($"Not all actions have a corresponding button in the row prefab. Actions: {string.Join(",",actions.Select(a => a.Name))}, Buttons: {string.Join(",",actionButtonGOs.Select(b => b.name))}");
        }

        rows.Add(row);

        return row;
    }

    private void LoadItemToRow<T>(T item, GameObject row) where T: BaseCompanyEntityViewModel
    {
        var rowCells = row.transform.GetComponentsInChildren<Transform>().Select(t => t.gameObject).Where(go => go.name.Contains("Cell"));
            
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
        }
    }
    
    public void Refresh<T>(List<T> items)  where T: BaseCompanyEntityViewModel
    {
        foreach(T item in items)
        {
            var row = rows.Find(r => r.name == item.Id);

            if(row == null) {
                row = CreateRow(item,standardActions);
            }

            LoadItemToRow(item,row);
        }
    }
}

using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using TMPro;
using System.Linq;

public struct RowAction
{
    public string Name;
    public Action Callback;
}
public class UITable : MonoBehaviour
{
    public GameObject rowPrototype;
    private List<GameObject> rows = new List<GameObject>();
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

    public void Populate<T>(List<T> items,List<RowAction> callbacks)  where T: BaseCompanyEntityViewModel
    {
        foreach(T item in items)
        {
            var row = CreateRow(item);
            LoadItemToRow(item,row);
        }
    }

    private GameObject CreateRow<T>(T item) where T: BaseCompanyEntityViewModel
    {
        var row = Instantiate(rowPrototype);
        row.name = item.GetType().GetProperty("Id").GetValue(item).ToString();

        row.gameObject.transform.parent = rowPrototype.transform.parent;
        var rowRect = row.GetComponent<RectTransform>();
        var protoHeight = rowPrototype.GetComponent<RectTransform>().sizeDelta.y;
        var protoPos = rowPrototype.GetComponent<RectTransform>().position;
        rowRect.position = new Vector3(protoPos.x,protoPos.y-(protoHeight*rows.Count));
        row.SetActive(true);

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
                row = CreateRow(item);
            }

            LoadItemToRow(item,row);
        }
    }
}

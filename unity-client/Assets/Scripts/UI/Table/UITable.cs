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
    private GameObject rowPrototype;
    private List<GameObject> rows;
    void Start()
    {
        rowPrototype = transform.Find("TableRow")?.gameObject;

        if(!rowPrototype)
        {
            throw new NullReferenceException("Table Row prototype must be present");
        }

        rowPrototype.SetActive(false);
    }
    void Update()
    {
        
    }

    public void Populate<T>(IEnumerable<T> items,List<RowAction> callbacks)  where T: BaseCompanyEntityViewModel
    {
        foreach(T item in items)
        {
            var row = Instantiate(rowPrototype);
            var itemProps = item.GetType().GetProperties();
            var rowCells = row.transform.GetComponentsInChildren<Transform>().Select(t => t.gameObject);

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

            rows.Add(row);
        }
    }
}

using System.Collections.Generic;
using UnityEngine;

public abstract class BaseUIDataView : MonoBehaviour
{
    public GameObject itemPrototype;
    public GameObject actionButtonPrototype;

    protected List<GameObject> items = new List<GameObject>();
    protected List<UIAction> currentActions = new List<UIAction>();

    protected abstract void Start();

    public abstract void Populate<T>(List<T> items,List<UIAction> actions)  where T: BaseViewModel;

    protected abstract GameObject createItem<T>(T item) where T: BaseViewModel;

    public abstract void Refresh<T>(List<T> data)  where T: BaseViewModel;

    public abstract void SetActions(List<UIAction> actions);

    protected abstract void deleteItem(GameObject itemToDelete);

    protected abstract void loadDataToItem<T>(T data, GameObject item) where T: BaseViewModel;

    protected abstract void remapItemActions(GameObject item);
    
    protected abstract void loadActionsToItem(GameObject item, List<UIAction> actions);
}
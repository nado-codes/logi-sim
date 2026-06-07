using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.UI;

public abstract class BaseUIDataView : MonoBehaviour
{
    public int itemSpacingPx = 5;

    public GameObject itemPrototype;
    public GameObject actionButtonPrototype;

    protected NotificationConfig notificationConfig = Utils.LoadNotificationConfig();

    protected List<GameObject> items = new List<GameObject>();
    protected Func<string, List<UIItemAction>> actionFactory = (_) => new List<UIItemAction>();

    protected virtual void Start()
    {
        if(!itemPrototype)
        {
            throw new NullReferenceException("Item prototype must be set");
        }

        if(!actionButtonPrototype)
        {
            throw new NullReferenceException("Action Button prototype must be set");
        }

        itemPrototype.SetActive(false);
        actionButtonPrototype.SetActive(false);
    }

    public void Populate<T>(List<T> dataList,Func<string, List<UIItemAction>> factory) where T: BaseViewModel
    {
        for(var i = 0; i < items.Count; i++)
            deleteItem(items[i]);

        foreach(T data in dataList)
        {
            var item = createItem(data);
            loadActionsToItem(item, factory(data.Id));
        }

        actionFactory = factory;

        OnPopulate();
    }

    public virtual void OnPopulate() {}

    protected abstract GameObject createItem<T>(T item) where T: BaseViewModel;

    public void Refresh<T>(List<T> dataList) where T: BaseViewModel
    {
        if(actionFactory == null)
        {
            throw new NullReferenceException("Action Factory cannot be null");
        }

        foreach(T data in dataList)
        {
            var item = items.Find(r => r.name == data.Id);

            if(item == null) {
                item = createItem(data);
                loadActionsToItem(item, actionFactory(data.Id));
            }

            loadDataToItem(data,item);
        }

        var itemsToDelete = items.Where(item => !dataList.Any(data => data.Id == item.name)).ToList();
        
        foreach(var item in itemsToDelete)
            deleteItem(item);

        OnRefresh();
    }

    public virtual void OnRefresh() {}

    public void SetActionFactory(Func<string, List<UIItemAction>> factory)
    {
        if(notificationConfig.logUINotifications.actions.Create)
        {
            Debug.Log("Setting action factory "+JsonConvert.SerializeObject(factory));
        }
        
        foreach(var row in items) {
            loadActionsToItem(row, factory(row.name));
        }

        actionFactory = factory;
    }

    protected abstract void deleteItem(GameObject itemToDelete);

    protected abstract void loadDataToItem<T>(T data, GameObject item) where T: BaseViewModel;

    protected void remapItemActions(GameObject item)
    {
        var actionButtons = item.transform.GetComponentsInChildren<Button>();
        var actions = actionFactory(item.name);

        foreach(var button in actionButtons)
        {
            var action = actions.FirstOrDefault(a => a.Name+"ActionButton" == button.gameObject.name);

            if(action != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(() => action.Invoke(item.name));
            }
            else
            {
                Debug.LogError("Could not find action for button "+button.gameObject.name+" when remapping item actions");
            }
        }
    }
    
    protected abstract void loadActionsToItem(GameObject item, List<UIItemAction> actions);
}
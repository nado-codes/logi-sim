using UnityEngine;

public class ContractHUD : MonoBehaviour
{
    [SerializeField] protected GameObject cardPrefab;
    [SerializeField] protected Transform cardContainer;

    public void ClearCards()
    {
        foreach (Transform child in cardContainer)
        {
            Destroy(child.gameObject);
        }
    }

    public void AddCard(GameObject card)
    {
        card.transform.SetParent(cardContainer, false);
        card.SetActive(true);
    }
}
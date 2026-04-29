using System.Collections;
using UnityEngine;
using UnityEngine.AI;

public class WanderingNPC : MonoBehaviour
{
    public Transform[] waypoints;  // Drag desk + vending machine + water cooler in inspector
    public float minWait = 5f;
    public float maxWait = 15f;

    private NavMeshAgent agent;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();
        GotoRandomWaypoint();
        StartCoroutine(WanderRoutine());
    }

    void GotoRandomWaypoint()
    {
        Transform target = waypoints[Random.Range(0, waypoints.Length)];
        agent.SetDestination(target.position);
    }

    IEnumerator WanderRoutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(Random.Range(minWait, maxWait));
            GotoRandomWaypoint();
        }
    }
}

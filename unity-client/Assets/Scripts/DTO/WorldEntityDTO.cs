using UnityEngine;

public class WorldEntityDTO : BaseEntityDTO, INamedEntity
{
    public Vector3 Position { get; set; }
    public string Name { get; set; }

    public GameObject GameObject { get; set; }
}
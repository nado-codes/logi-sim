using UnityEngine;

public class WorldEntityDTO : BaseEntityDTO, INamedEntity
{
    public Pos3D Position { get; set; }
    public string Name { get; set; }

    //public GameObject GameObject { get; set; }
}
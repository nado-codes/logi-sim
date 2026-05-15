using System.Collections.Generic;

public enum ResourceType
{
    Grain,    
    Flour,
    Bread,
    Unknown
}

public enum LocationType
{
    Producer,
    Processor,
    Town
}

public enum ContractBreakType
{
    Supplier,
    Destination,
    Shipper
}

public class Recipe
{
    public Dictionary<ResourceType, int> Inputs { get; set; }
    public Dictionary<ResourceType, int> Outputs { get; set; }
}
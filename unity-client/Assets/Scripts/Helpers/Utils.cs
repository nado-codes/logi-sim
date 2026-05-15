public static class Utils
{
    public static ResourceType GetResourceTypeFromItemId(string resourceItemId)
    {
        // This is a placeholder implementation. In future verions, we would look this up from a database or a dictionary.
        switch (resourceItemId)
        {
            case "resource-grain":
                return ResourceType.Grain;
            case "resource-flour":
                return ResourceType.Flour;
            case "resource-bread":
                return ResourceType.Bread;
                default:
                return ResourceType.Unknown;
        }
    }
}
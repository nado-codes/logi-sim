using System.Collections.Generic;
using System.Linq;

public class RecipeViewModel
{
    public Dictionary<ResourceType, string> Inputs { get; set; }
    public Dictionary<ResourceType, string> Outputs { get; set; }

    public static RecipeViewModel FromDTO(Recipe dto)
    {
        return new RecipeViewModel
        {
            Inputs = dto.Inputs?.ToDictionary(i => i.Key, i => i.Value.ToString("N0")),
            Outputs = dto.Outputs?.ToDictionary(o => o.Key, o => o.Value.ToString("N0"))
        };
    }
}
using System;
using System.Collections.Generic;

public class TruckViewModel : BaseCompanyEntityViewModel, INamedEntity
{
    public string Name{get;set;}

    public string ResourceName{ get; set; }
    public string ResourceCount { get; set; }
    public string ResourceCapacity { get; set; }
    public string DestinationName { get; set; }
    

    public static TruckViewModel FromDTO(
    TruckDTO dto,
    List<CompanyDTO> companies, 
    List<LocationDTO> locations)
    {
        var company = companies.Find(c => c.Id == dto.CompanyId);
        var destination = locations.Find(l => l.Id == dto.DestinationId);

        if(company == null)
        {
            throw new NullReferenceException($"Company with id ${dto.CompanyId} doesn't exist");
        }

        return new TruckViewModel
        {
            Id = dto.Id,
            Name = dto.Name,
            CompanyName = company.Name,
            DestinationName = destination?.Name ?? "None",
            ResourceName = dto.Storage.ResourceType.ToString(),
            ResourceCount = dto.Storage.ResourceCount.ToString("N0"),
            ResourceCapacity = dto.Storage.ResourceCapacity.ToString("N0"),
        };
    }
}
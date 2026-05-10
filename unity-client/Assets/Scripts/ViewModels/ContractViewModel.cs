using System;
using System.Collections.Generic;

public class ContractViewModel : BaseCompanyEntityViewModel
{
    public string ShipperName {get;set;}
    public string SupplierName { get; set; }
    public string DestinationName { get; set; }
    public string? TruckName { get; set; }
    public string ResourceName { get; set; }
    public int TotalAmount { get; set; }
    public int Payment { get; set; }
    public int DueInTicks { get; set; }
    public float Distance {get;set;}
    public int? DeliveredTick { get; set; }
    public int? AcceptedAtTick { get; set; }

    public static ContractViewModel FromDTO(
    ContractDTO dto,
    List<CompanyDTO> companies, 
    List<LocationDTO> locations, 
    List<TruckDTO> trucks,
    int currentTick)
    {
        var company = companies.Find(c => c.Id == dto.CompanyId);
        var supplier = locations.Find(l => l.Id == dto.SupplierId);
        var destination = locations.Find(l => l.Id == dto.DestinationId);
        var shipper = companies.Find(c => c.Id == dto.ShipperId);
        var truck = trucks.Find(t => t.Id == dto.TruckId);

        if(company == null)
        {
            throw new NullReferenceException($"Company with id ${dto.CompanyId} doesn't exist");
        }
        if(supplier == null)
        {
            throw new NullReferenceException($"Supplier with id ${dto.SupplierId} doesn't exist");
        }
        if(destination == null)
        {
            throw new NullReferenceException($"Destination with id ${dto.DestinationId} doesn't exist");
        }

        return new ContractViewModel
        {
            Id = dto.Id,
            CompanyName = company.Name,
            SupplierName = supplier.Name,
            DestinationName = destination.Name,
            ShipperName = shipper.Name,
            TruckName = truck?.Name ?? "N/A",
            ResourceName = dto.ResourceType.ToString(),
            TotalAmount = dto.TotalAmount,
            Payment = dto.Payment,
            DueInTicks = dto.ExpectedTick - currentTick,
            Distance = MathUtils.Distance(supplier.Position.x,supplier.Position.y,supplier.Position.z,destination.Position.x,destination.Position.y,destination.Position.z),
            DeliveredTick = dto.DeliveredTick,
            AcceptedAtTick = dto.AcceptedAtTick
        };
    }
}
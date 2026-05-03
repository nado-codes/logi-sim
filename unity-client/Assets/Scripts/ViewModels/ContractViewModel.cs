using System;
using System.Collections.Generic;
using UnityEngine;

public class ContractViewModel : ICompanyEntity
{
    public string Id { get; set;}
    public string CompanyId { get; set;}

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
    List<LocationDTO> locations, 
    List<TruckDTO> trucks,
    int currentTick)
    {
        var supplier = locations.Find(l => l.Id == dto.SupplierId);
        var destination = locations.Find(l => l.Id == dto.DestinationId);
        var truck = trucks.Find(t => t.Id == dto.TruckId);

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
            CompanyId = dto.CompanyId,
            SupplierName = supplier.Name,
            DestinationName = destination.Name,
            ResourceName = dto.ResourceType.ToString(),
            TotalAmount = dto.TotalAmount,
            Payment = dto.Payment,
            DueInTicks = dto.ExpectedTick - currentTick,
            TruckName = truck?.Name ?? "N/A",
            Distance = Vector3.Distance(supplier.Position,destination.Position),
            DeliveredTick = dto.DeliveredTick,
            AcceptedAtTick = dto.AcceptedAtTick
        };
    }
}
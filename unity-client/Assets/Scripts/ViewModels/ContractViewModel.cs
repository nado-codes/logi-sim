using System;
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;

public class ContractViewModel : BaseCompanyEntityViewModel
{
    public string ShipperName {get;set;}
    public string SupplierName { get; set; }
    public string DestinationName { get; set; }
    public string? TruckName { get; set; }
    public string ResourceName { get; set; }
    public string TotalAmount { get; set; }
    public string Payment { get; set; }
    public string DueInTicks { get; set; }
    public string Distance {get;set;}
    public string? DeliveredTick { get; set; }
    public string? AcceptedAtTick { get; set; }

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
            Debug.LogError(JsonConvert.SerializeObject(companies));
            throw new NullReferenceException($"Company with id ${dto.CompanyId} doesn't exist");
        }
        if(supplier == null)
        {
            Debug.LogError(JsonConvert.SerializeObject(locations));
            throw new NullReferenceException($"Supplier with id ${dto.SupplierId} doesn't exist");
        }
        if(destination == null)
        {
            Debug.LogError(JsonConvert.SerializeObject(locations));
            throw new NullReferenceException($"Destination with id ${dto.DestinationId} doesn't exist");
        }

        return FromDTO(dto,() => {
            return new ContractViewModel
            {
                Id = dto.Id,
                CompanyName = company.Name,
                SupplierName = supplier.Name,
                DestinationName = destination.Name,
                ShipperName = shipper?.Name ?? "N/A",
                TruckName = truck?.Name ?? "N/A",
                ResourceName = dto.ResourceType.ToString(),
                TotalAmount = dto.TotalAmount.ToString("N0"),
                Payment = dto.Payment.ToString("C"),
                DueInTicks = (dto.ExpectedTick - currentTick).ToString()+" ticks",
                Distance = MathUtils.Distance(supplier.Position.x,supplier.Position.y,supplier.Position.z,destination.Position.x,destination.Position.y,destination.Position.z).ToString()+"km",
                DeliveredTick = "Tick "+dto.DeliveredTick.ToString(),
                AcceptedAtTick = "Tick "+dto.AcceptedAtTick.ToString()
            };
        });
    }
}
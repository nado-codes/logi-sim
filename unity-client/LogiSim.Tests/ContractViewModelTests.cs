namespace LogiSim.Tests;

public class ContractViewModelTests
{
    [SetUp]
    public void Setup()
    {
        
    }

    [Test]
    public void FromDTO_ResolvesToViewModel()
    {
        var companyOne = new CompanyDTO() {Id = "company-1", Name = "Company One"};
        var localShipper = new CompanyDTO() {Id = "loc-shipper", Name= "Local Shipper"};
        var companies = new List<CompanyDTO>() {
            companyOne,
            localShipper,
        };

        var localTruck = new TruckDTO() {Id="loc-truck", Name= "Local Truck"};
        var trucks = new List<TruckDTO>()
        {
            localTruck
        };

        var localSupplier = new LocationDTO() {Id = "loc-supplier", Name = "Local Supplier"};
        var localDestination = new LocationDTO() {Id = "loc-dest", Name = "Local Destination"};

        var locations = new List<LocationDTO>()
        {
            localSupplier,
            localDestination
        };

        var contractDTO = new ContractDTO()
        {
            Id = "contract-1",
            CompanyId = "company-1",
            ShipperId = "loc-shipper",
            SupplierId = "loc-supplier",
            DestinationId = "loc-dest",
            TruckId = "loc-truck",
            ResourceType = ResourceType.Grain,
            TotalAmount = 500,
            Payment = 5000,
            ExpectedTick = 1000,
            DeliveredTick = null,
            AcceptedAtTick = null
        };
        var contractViewModel = ContractViewModel.FromDTO(contractDTO,companies,locations,trucks,0);

        Assert.That(contractViewModel.CompanyName == companyOne.Name);
        Assert.That(contractViewModel.SupplierName == localSupplier.Name);
        Assert.That(contractViewModel.DestinationName == localDestination.Name);
        Assert.That(contractViewModel.ShipperName == localShipper.Name);

        if(contractViewModel.TruckName == null)
        {
            Assert.Fail("contractDTO.TruckId must resolve to a Truck");
            return;
        }

        Assert.That(contractViewModel.TruckName == localTruck.Name);
    }
}

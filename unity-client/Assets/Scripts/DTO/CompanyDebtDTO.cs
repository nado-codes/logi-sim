public class CompanyDebtDTO : BaseEntityDTO
{
    public string CreditorCompanyId { get; set; }
    public float Amount { get; set; }
    public float PaymentPerTick { get; set; }
    public string Reason { get; set; }
    public int CreatedAtTick { get; set; }
}
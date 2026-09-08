using UnityEngine;

public class CompanyDebtViewModel : BaseViewModel
{
    public string CreditorCompanyId { get; set; }
    public string CreditorCompanyName { get; set; }
    public float RawAmount { get; set; }
    public string Amount { get; set; }
    public string Description { get; set; }

    public static CompanyDebtViewModel FromDTO(CompanyDebtDTO dto)
    {
        var creditorCompany = Client.CompanyDTOs.Find(c => c.Id == dto.CreditorCompanyId);

        string creditorName;
        if (creditorCompany == null)
        {
            Debug.LogWarning($"CompanyDebtViewModel: Creditor company with ID {dto.CreditorCompanyId} not found in cache. Falling back to placeholder name.");
            creditorName = "Unknown Creditor";
        }
        else
        {
            creditorName = creditorCompany.Name;
        }

        var description = $"Reason: {dto.Reason}\nPer-Tick Payment: {dto.PaymentPerTick:C}";

        return FromDTO(dto,() => {

            return new CompanyDebtViewModel()
            {
                Id = dto.Id,
                CreditorCompanyId = dto.CreditorCompanyId,
                CreditorCompanyName = creditorName,
                RawAmount = dto.Amount,
                Amount = dto.Amount.ToString("C"),
                Description = description
            };
        });
    }
}
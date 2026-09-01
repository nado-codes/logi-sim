
using UnityEngine;

public enum RegulatoryActionStatus
    {
        None,
        PreProbation,
        Probation,
        PreSuspensionNotice,
        SuspensionNotice,
        PreCeasedOperations,
        CeasedOperations
    }

public class RegulatoryActionPanel : BaseWindow<RegulatoryActionPanel>
{
    private RegulatoryActionIndicator probationIndicator, suspensionNoticeIndicator,ceasedOperationsIndicator;
    protected void Start()
    {
        probationIndicator = transform.Find("pnProbation").GetComponent<RegulatoryActionIndicator>();
        suspensionNoticeIndicator = transform.Find("pnSuspensionNotice").GetComponent<RegulatoryActionIndicator>();
        ceasedOperationsIndicator = transform.Find("pnCeasedOperations").GetComponent<RegulatoryActionIndicator>();

        if(probationIndicator == null || suspensionNoticeIndicator == null || ceasedOperationsIndicator == null)
        {
            Debug.LogError("RegulatoryActionPanel: One or more regulatory indicators are missing!");
            throw new System.Exception("RegulatoryActionPanel: One or more regulatory indicators are missing!");
        }
        base.Start();
    }

    public void SetStatus(RegulatoryActionStatus status)
    {
        if(status == RegulatoryActionStatus.None)
        {
            Close();
        }
        else
        {
            Open();
        }

        switch (status)
        {
            case RegulatoryActionStatus.None:
                probationIndicator.TurnOff();
                suspensionNoticeIndicator.TurnOff();
                ceasedOperationsIndicator.TurnOff();
                break;
            case RegulatoryActionStatus.PreProbation:
                probationIndicator.Blink();
                suspensionNoticeIndicator.TurnOff();
                ceasedOperationsIndicator.TurnOff();
                break;
            case RegulatoryActionStatus.Probation:
                probationIndicator.TurnOn();
                suspensionNoticeIndicator.TurnOff();
                ceasedOperationsIndicator.TurnOff();
                break;
            case RegulatoryActionStatus.PreSuspensionNotice:
                probationIndicator.TurnOn();
                suspensionNoticeIndicator.Blink();
                ceasedOperationsIndicator.TurnOff();
                break;
            case RegulatoryActionStatus.SuspensionNotice:
                probationIndicator.TurnOff();
                suspensionNoticeIndicator.TurnOn();
                ceasedOperationsIndicator.TurnOff();
                break;
            case RegulatoryActionStatus.PreCeasedOperations:
                probationIndicator.TurnOff();
                suspensionNoticeIndicator.TurnOn();
                ceasedOperationsIndicator.Blink();
                break;
            case RegulatoryActionStatus.CeasedOperations:
                probationIndicator.TurnOff();
                suspensionNoticeIndicator.TurnOff();
                ceasedOperationsIndicator.TurnOn();
                break;
        }
    }
}

using UnityEngine;
using System.Collections.Generic;

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
    private RegulatoryActionStatus _currentStatus = RegulatoryActionStatus.None;
    public RegulatoryActionStatus CurrentStatus => _currentStatus;

    protected override void Start()
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

    private void showPrompt(RegulatoryActionStatus status)
    {
        switch (status)
        {
            case RegulatoryActionStatus.Probation:
                PromptController.ShowPrompt("Probation", "The Department of Transport has placed your company on probation due to outstanding debts. You are required to resolve all financial obligations to avoid further regulatory action.");
                break;
            case RegulatoryActionStatus.SuspensionNotice:
                PromptController.ShowPrompt("Suspension Notice", "Your company has received a formal suspension notice. You may not purchase new assets until all outstanding debts are resolved. You may continue operating your existing fleet and contracts, or voluntarily cease operations.");
                break;
            case RegulatoryActionStatus.CeasedOperations:
                PromptController.ShowPrompt("Ceased Operations", "The Department of Transport has revoked your operating authority. All company assets will be liquidated and proceeds distributed to creditors. Your employment has been terminated.");
                break;
        }
    }

    private void updateIndicators(RegulatoryActionStatus status)
    {
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

        updateIndicators(status);

        if(status != _currentStatus)
        {
            showPrompt(status);
        }

        _currentStatus = status;
    }
}
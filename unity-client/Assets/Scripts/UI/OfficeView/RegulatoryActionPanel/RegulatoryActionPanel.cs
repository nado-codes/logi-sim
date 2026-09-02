
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
        var probationText = "The Department of Transport has placed your company on probation due to outstanding debts. You are required to resolve all financial obligations to avoid further regulatory action.";
        var suspensionNoticeText = "Your company has received a formal suspension notice. You may not purchase new assets until all outstanding debts are resolved. You may continue operating your existing fleet and contracts, or voluntarily cease operations.";
        var ceasedOperationsText = "The Department of Transport has revoked your operating authority. All company assets will be liquidated and proceeds distributed to creditors. Your employment has been terminated.";
        switch (status)
        {
            case RegulatoryActionStatus.Probation:
                PromptController.ShowPrompt("Probation", probationText);
                break;
            case RegulatoryActionStatus.SuspensionNotice:
                PromptController.ShowPrompt("Suspension Notice", suspensionNoticeText,new List<UIItemAction>() { 
                    new UIItemAction{ Name = "Enter Voluntary Liquidation", Callback = (itemId) => {
                        Client.CallAPI($"/company/liquidate/{Client.ActiveCompanyId}",APICallType.Post);
                    } },
                    new UIItemAction{ Name = "Keep Operating", Callback = (itemId) => {} }
                });
                break;
            case RegulatoryActionStatus.CeasedOperations:
                PromptController.ShowPrompt("Ceased Operations", ceasedOperationsText);
                break;
        }
    }

    private void applyIndicatorState(RegulatoryActionIndicator indicator, RegulatoryActionIndicator.IndicatorState state)
    {
        switch (state)
        {
            case RegulatoryActionIndicator.IndicatorState.Off:
                indicator.TurnOff();
                break;
            case RegulatoryActionIndicator.IndicatorState.On:
                indicator.TurnOn();
                break;
            case RegulatoryActionIndicator.IndicatorState.Blinking:
                indicator.Blink();
                break;
        }
    }

    private void updateIndicators(RegulatoryActionStatus status)
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(status);
        applyIndicatorState(probationIndicator, states.Probation);
        applyIndicatorState(suspensionNoticeIndicator, states.SuspensionNotice);
        applyIndicatorState(ceasedOperationsIndicator, states.CeasedOperations);
    }

    public void SetStatus(RegulatoryActionStatus status)
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(status);

        if(states.PanelVisible)
        {
            Open();
        }
        else
        {
            Close();
        }

        updateIndicators(status);

        var promptToShow = RegulatoryActionLogic.GetPromptToShow(_currentStatus, status);
        if(promptToShow.HasValue)
        {
            showPrompt(promptToShow.Value);
        }

        _currentStatus = status;
    }
}
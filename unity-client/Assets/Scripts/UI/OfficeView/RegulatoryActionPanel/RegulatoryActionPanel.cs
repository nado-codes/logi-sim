
using UnityEngine;

public class RegulatoryActionPanel : BaseWindow<RegulatoryActionPanel>
{
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
    private RegulatoryActionIndicator probationIndicator, suspensionNoticeIndicator,ceasedOperationsIndicator;
    private RegulatoryActionStatus currentStatus = RegulatoryActionStatus.Probation;
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

    void Update()
    {
        if(Input.GetKeyDown(KeyCode.Alpha1))
        {
            SetStatus(RegulatoryActionStatus.None);
            Close();
        }
        if(Input.GetKeyDown(KeyCode.Alpha2))
        {
            SetStatus(RegulatoryActionStatus.PreProbation);
            Open();
        }
        if(Input.GetKeyDown(KeyCode.Alpha3))
        {
            SetStatus(RegulatoryActionStatus.Probation);
            Open();
        }
        if(Input.GetKeyDown(KeyCode.Alpha4))
        {
            SetStatus(RegulatoryActionStatus.PreSuspensionNotice);
            Open();
        }
        if(Input.GetKeyDown(KeyCode.Alpha5))
        {
            SetStatus(RegulatoryActionStatus.SuspensionNotice);
            Open();
        }
        if(Input.GetKeyDown(KeyCode.Alpha6))
        {
            SetStatus(RegulatoryActionStatus.PreCeasedOperations);
            Open();
        }
        if(Input.GetKeyDown(KeyCode.Alpha7))
        {
            SetStatus(RegulatoryActionStatus.CeasedOperations);
            Open();
        }
    }

    public void SetStatus(RegulatoryActionStatus status)
    {
        currentStatus = status;
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
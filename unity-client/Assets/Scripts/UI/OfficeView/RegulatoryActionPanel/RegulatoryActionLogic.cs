public struct IndicatorStates
{
    public RegulatoryActionIndicator.IndicatorState Probation;
    public RegulatoryActionIndicator.IndicatorState SuspensionNotice;
    public RegulatoryActionIndicator.IndicatorState CeasedOperations;
    public bool PanelVisible;
}

public static class RegulatoryActionLogic
{
    public static IndicatorStates GetIndicatorStates(RegulatoryActionStatus status)
    {
        switch (status)
        {
            case RegulatoryActionStatus.None:
                return new IndicatorStates
                {
                    Probation = RegulatoryActionIndicator.IndicatorState.Off,
                    SuspensionNotice = RegulatoryActionIndicator.IndicatorState.Off,
                    CeasedOperations = RegulatoryActionIndicator.IndicatorState.Off,
                    PanelVisible = false
                };
            case RegulatoryActionStatus.PreProbation:
                return new IndicatorStates
                {
                    Probation = RegulatoryActionIndicator.IndicatorState.Blinking,
                    SuspensionNotice = RegulatoryActionIndicator.IndicatorState.Off,
                    CeasedOperations = RegulatoryActionIndicator.IndicatorState.Off,
                    PanelVisible = true
                };
            case RegulatoryActionStatus.Probation:
                return new IndicatorStates
                {
                    Probation = RegulatoryActionIndicator.IndicatorState.On,
                    SuspensionNotice = RegulatoryActionIndicator.IndicatorState.Off,
                    CeasedOperations = RegulatoryActionIndicator.IndicatorState.Off,
                    PanelVisible = true
                };
            case RegulatoryActionStatus.PreSuspensionNotice:
                return new IndicatorStates
                {
                    Probation = RegulatoryActionIndicator.IndicatorState.On,
                    SuspensionNotice = RegulatoryActionIndicator.IndicatorState.Blinking,
                    CeasedOperations = RegulatoryActionIndicator.IndicatorState.Off,
                    PanelVisible = true
                };
            case RegulatoryActionStatus.SuspensionNotice:
                return new IndicatorStates
                {
                    Probation = RegulatoryActionIndicator.IndicatorState.Off,
                    SuspensionNotice = RegulatoryActionIndicator.IndicatorState.On,
                    CeasedOperations = RegulatoryActionIndicator.IndicatorState.Off,
                    PanelVisible = true
                };
            case RegulatoryActionStatus.PreCeasedOperations:
                return new IndicatorStates
                {
                    Probation = RegulatoryActionIndicator.IndicatorState.Off,
                    SuspensionNotice = RegulatoryActionIndicator.IndicatorState.On,
                    CeasedOperations = RegulatoryActionIndicator.IndicatorState.Blinking,
                    PanelVisible = true
                };
            case RegulatoryActionStatus.CeasedOperations:
                return new IndicatorStates
                {
                    Probation = RegulatoryActionIndicator.IndicatorState.Off,
                    SuspensionNotice = RegulatoryActionIndicator.IndicatorState.Off,
                    CeasedOperations = RegulatoryActionIndicator.IndicatorState.On,
                    PanelVisible = true
                };
            default:
                throw new System.ArgumentOutOfRangeException(nameof(status), status, null);
        }
    }

    // Prompts fire only on transitions into a real tier (Probation, SuspensionNotice,
    // CeasedOperations) - never on pre-states, None, or when the status hasn't changed.
    public static RegulatoryActionStatus? GetPromptToShow(RegulatoryActionStatus previousStatus, RegulatoryActionStatus newStatus)
    {
        if (newStatus == previousStatus)
        {
            return null;
        }

        switch (newStatus)
        {
            case RegulatoryActionStatus.Probation:
            case RegulatoryActionStatus.SuspensionNotice:
            case RegulatoryActionStatus.CeasedOperations:
                return newStatus;
            default:
                return null;
        }
    }
}

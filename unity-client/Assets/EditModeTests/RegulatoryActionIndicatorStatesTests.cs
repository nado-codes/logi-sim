using NUnit.Framework;

public class RegulatoryActionIndicatorStatesTests
{
    [Test]
    public void None_AllOff_PanelNotVisible()
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(RegulatoryActionStatus.None);

        Assert.That(states.Probation, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.SuspensionNotice, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.CeasedOperations, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.PanelVisible, Is.False);
    }

    [Test]
    public void PreProbation_ProbationBlinking_OthersOff_PanelVisible()
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(RegulatoryActionStatus.PreProbation);

        Assert.That(states.Probation, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Blinking));
        Assert.That(states.SuspensionNotice, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.CeasedOperations, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.PanelVisible, Is.True);
    }

    [Test]
    public void Probation_ProbationOn_OthersOff_PanelVisible()
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(RegulatoryActionStatus.Probation);

        Assert.That(states.Probation, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.On));
        Assert.That(states.SuspensionNotice, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.CeasedOperations, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.PanelVisible, Is.True);
    }

    [Test]
    public void PreSuspensionNotice_ProbationOn_SuspensionBlinking_CeasedOff()
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(RegulatoryActionStatus.PreSuspensionNotice);

        Assert.That(states.Probation, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.On));
        Assert.That(states.SuspensionNotice, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Blinking));
        Assert.That(states.CeasedOperations, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.PanelVisible, Is.True);
    }

    [Test]
    public void SuspensionNotice_SuspensionOn_OthersOff_PanelVisible()
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(RegulatoryActionStatus.SuspensionNotice);

        Assert.That(states.Probation, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.SuspensionNotice, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.On));
        Assert.That(states.CeasedOperations, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.PanelVisible, Is.True);
    }

    [Test]
    public void PreCeasedOperations_SuspensionOn_CeasedBlinking_ProbationOff()
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(RegulatoryActionStatus.PreCeasedOperations);

        Assert.That(states.Probation, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.SuspensionNotice, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.On));
        Assert.That(states.CeasedOperations, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Blinking));
        Assert.That(states.PanelVisible, Is.True);
    }

    [Test]
    public void CeasedOperations_CeasedOn_OthersOff_PanelVisible()
    {
        var states = RegulatoryActionLogic.GetIndicatorStates(RegulatoryActionStatus.CeasedOperations);

        Assert.That(states.Probation, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.SuspensionNotice, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.Off));
        Assert.That(states.CeasedOperations, Is.EqualTo(RegulatoryActionIndicator.IndicatorState.On));
        Assert.That(states.PanelVisible, Is.True);
    }
}

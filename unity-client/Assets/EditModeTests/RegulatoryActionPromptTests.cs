using NUnit.Framework;

public class RegulatoryActionPromptTests
{
    [Test]
    public void NoTransition_SameStatus_ReturnsNull()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.Probation, RegulatoryActionStatus.Probation);

        Assert.That(result, Is.Null);
    }

    [Test]
    public void TransitionToNone_ReturnsNull()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.CeasedOperations, RegulatoryActionStatus.None);

        Assert.That(result, Is.Null);
    }

    [Test]
    public void TransitionToPreProbation_ReturnsNull()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.None, RegulatoryActionStatus.PreProbation);

        Assert.That(result, Is.Null);
    }

    [Test]
    public void TransitionToProbation_FromNone_ReturnsProbation()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.None, RegulatoryActionStatus.Probation);

        Assert.That(result, Is.EqualTo(RegulatoryActionStatus.Probation));
    }

    [Test]
    public void TransitionToProbation_FromPreProbation_ReturnsProbation()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.PreProbation, RegulatoryActionStatus.Probation);

        Assert.That(result, Is.EqualTo(RegulatoryActionStatus.Probation));
    }

    [Test]
    public void TransitionToSuspensionNotice_FromProbation_ReturnsSuspensionNotice()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.Probation, RegulatoryActionStatus.SuspensionNotice);

        Assert.That(result, Is.EqualTo(RegulatoryActionStatus.SuspensionNotice));
    }

    [Test]
    public void TransitionToSuspensionNotice_FromPreSuspensionNotice_ReturnsSuspensionNotice()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.PreSuspensionNotice, RegulatoryActionStatus.SuspensionNotice);

        Assert.That(result, Is.EqualTo(RegulatoryActionStatus.SuspensionNotice));
    }

    [Test]
    public void TransitionToCeasedOperations_FromSuspensionNotice_ReturnsCeasedOperations()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.SuspensionNotice, RegulatoryActionStatus.CeasedOperations);

        Assert.That(result, Is.EqualTo(RegulatoryActionStatus.CeasedOperations));
    }

    [Test]
    public void TransitionToCeasedOperations_FromPreCeasedOperations_ReturnsCeasedOperations()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.PreCeasedOperations, RegulatoryActionStatus.CeasedOperations);

        Assert.That(result, Is.EqualTo(RegulatoryActionStatus.CeasedOperations));
    }

    [Test]
    public void TransitionBackward_FromSuspensionNoticeToProbation_ReturnsProbation()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.SuspensionNotice, RegulatoryActionStatus.Probation);

        Assert.That(result, Is.EqualTo(RegulatoryActionStatus.Probation));
    }

    [Test]
    public void TransitionFromCeasedOperationsToNone_ReturnsNull()
    {
        var result = RegulatoryActionLogic.GetPromptToShow(RegulatoryActionStatus.CeasedOperations, RegulatoryActionStatus.None);

        Assert.That(result, Is.Null);
    }
}

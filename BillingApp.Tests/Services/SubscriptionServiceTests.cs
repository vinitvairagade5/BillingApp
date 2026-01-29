using BillingApp.Core.Abstractions;
using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using BillingApp.Core.Services;
using FluentAssertions;
using Moq;
using System.Data;
using Xunit;

namespace BillingApp.Tests.Services;

public class SubscriptionServiceTests
{
    private readonly Mock<IDbConnectionFactory> _dbConnectionFactoryMock;
    private readonly Mock<ISubscriptionRepository> _repositoryMock;
    private readonly Mock<IDbConnection> _dbConnectionMock;
    private readonly Mock<IDbTransaction> _dbTransactionMock;
    private readonly SubscriptionService _service;

    public SubscriptionServiceTests()
    {
        _dbConnectionFactoryMock = new Mock<IDbConnectionFactory>();
        _repositoryMock = new Mock<ISubscriptionRepository>();
        _dbConnectionMock = new Mock<IDbConnection>();
        _dbTransactionMock = new Mock<IDbTransaction>();

        _dbConnectionFactoryMock.Setup(x => x.CreateConnection()).Returns(_dbConnectionMock.Object);
        _dbConnectionMock.Setup(x => x.BeginTransaction()).Returns(_dbTransactionMock.Object);

        _service = new SubscriptionService(_dbConnectionFactoryMock.Object, _repositoryMock.Object);
    }

    [Fact]
    public async Task CheckInvoiceLimitAsync_UserNotFound_ReturnsFailure()
    {
        // Arrange
        _repositoryMock.Setup(x => x.GetUserAsync(It.IsAny<int>(), null, null))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _service.CheckInvoiceLimitAsync(1);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("User not found");
    }

    [Fact]
    public async Task CheckInvoiceLimitAsync_UserIsPro_ReturnsSuccess()
    {
        // Arrange
        var user = new User { SubscriptionType = "PRO", SubscriptionExpiry = DateTime.UtcNow.AddDays(1) };
        _repositoryMock.Setup(x => x.GetUserAsync(1, null, null))
            .ReturnsAsync(user);

        // Act
        var result = await _service.CheckInvoiceLimitAsync(1);

        // Assert
        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task CheckInvoiceLimitAsync_UserIsFree_UnderLimit_ReturnsSuccess()
    {
        // Arrange
        var user = new User { SubscriptionType = "FREE" };
        _repositoryMock.Setup(x => x.GetUserAsync(1, null, null))
            .ReturnsAsync(user);
        
        _repositoryMock.Setup(x => x.GetInvoiceCountAsync(1, null, null))
            .ReturnsAsync(5); // Less than 10

        // Act
        var result = await _service.CheckInvoiceLimitAsync(1);

        // Assert
        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task CheckInvoiceLimitAsync_UserIsFree_OverLimit_ReturnsFailure()
    {
        // Arrange
        var user = new User { SubscriptionType = "FREE" };
        _repositoryMock.Setup(x => x.GetUserAsync(1, null, null))
            .ReturnsAsync(user);
        
        _repositoryMock.Setup(x => x.GetInvoiceCountAsync(1, null, null))
            .ReturnsAsync(10); // Limit reached

        // Act
        var result = await _service.CheckInvoiceLimitAsync(1);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Free limit reached");
    }
}

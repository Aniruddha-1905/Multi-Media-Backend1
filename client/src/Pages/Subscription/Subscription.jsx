import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionPlans, fetchCurrentSubscription, subscribeToPlan, cancelSubscription } from '../../action/subscriptionActions';
import './Subscription.css';
import Leftsidebar from '../../Component/Leftsidebar/Leftsidebar';

const Subscription = () => {
    const dispatch = useDispatch();
    const currentuser = useSelector(state => state.currentuserreducer);
    const { plans, currentPlan, currentSubscription, subscriptionExpiry, watchTimeLimit } = useSelector(state => state.subscription);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch subscription plans
                await dispatch(fetchSubscriptionPlans());

                // Fetch current subscription if user is logged in
                if (currentuser?.result?._id) {
                    await dispatch(fetchCurrentSubscription());
                }
            } catch (error) {
                console.error('Error fetching subscription data:', error);
                setError('Failed to load subscription data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dispatch, currentuser]);

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
    };

    const handleCancelSubscription = async () => {
        if (window.confirm('Are you sure you want to cancel your subscription? You will be downgraded to the free plan.')) {
            setLoading(true);
            try {
                const result = await dispatch(cancelSubscription());
                if (result.success) {
                    alert('Subscription cancelled successfully');
                    // Refresh subscription data
                    await dispatch(fetchCurrentSubscription());
                } else {
                    setError('Failed to cancel subscription. Please try again.');
                }
            } catch (error) {
                console.error('Error cancelling subscription:', error);
                setError('Failed to cancel subscription. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePayment = async () => {
        if (!selectedPlan) return;

        setPaymentProcessing(true);
        setError(null);
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Process subscription
            const paymentId = `PAYMENT-${Date.now()}`;
            const result = await dispatch(subscribeToPlan(selectedPlan.id, paymentId));

            if (result.error) {
                setError(result.error);
                setPaymentSuccess(false);
                // If session expired, redirect to login after a delay
                if (result.error.includes('session has expired')) {
                    setTimeout(() => {
                        window.location.href = '/auth'; // Redirect to login page
                    }, 3000);
                }
                return;
            }

            if (result.success) {
                // Store invoice details from the response
                setPaymentSuccess({
                    invoiceId: result.invoice?.id,
                    email: result.invoice?.email || currentuser?.result?.email,
                    plan: result.invoice?.plan || selectedPlan.name,
                    amount: result.invoice?.amount || selectedPlan.price,
                    date: result.invoice?.date || new Date().toISOString(),
                    validUntil: result.invoice?.validUntil
                });

                // Refresh subscription data after a short delay
                setTimeout(async () => {
                    await dispatch(fetchCurrentSubscription());
                    // Keep the modal open longer so user can see the invoice details
                    setTimeout(() => {
                        setShowPaymentModal(false);
                        setPaymentSuccess(false);
                        setSelectedPlan(null);
                    }, 5000);
                }, 1000);
            } else {
                setError('Failed to process subscription. Please try again.');
                setPaymentSuccess(false);
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            setError('Failed to process payment. Please try again.');
            setPaymentSuccess(false);
        } finally {
            setPaymentProcessing(false);
        }
    };

    const formatWatchTime = (seconds) => {
        if (seconds === -1) return 'Unlimited';
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minutes`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="subscription-container">
                <Leftsidebar />
                <div className="subscription-content">
                    <div className="loading">Loading subscription data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="subscription-container">
                <Leftsidebar />
                <div className="subscription-content">
                    <div className="error">{error}</div>
                    <button className="retry-button" onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!currentuser?.result) {
        return (
            <div className="subscription-container">
                <Leftsidebar />
                <div className="subscription-content">
                    <div className="login-message">
                        <h2>Please log in to manage your subscription</h2>
                        <p>You need to be logged in to view and manage your subscription plans.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="subscription-container">
            <Leftsidebar />
            <div className="subscription-content">
                <h1>Subscription Plans</h1>

                {/* Current Subscription Info */}
                <div className="current-subscription">
                    <h2>Your Current Plan</h2>
                    <div className="subscription-details">
                        <div className="detail-item">
                            <span className="detail-label">Plan:</span>
                            <span className="detail-value">{currentPlan?.name || 'Free Plan'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Watch Time Limit:</span>
                            <span className="detail-value">{formatWatchTime(watchTimeLimit)}</span>
                        </div>
                        {subscriptionExpiry && (
                            <div className="detail-item">
                                <span className="detail-label">Expires On:</span>
                                <span className="detail-value">{formatDate(subscriptionExpiry)}</span>
                            </div>
                        )}
                    </div>

                    {currentPlan && currentPlan.id !== 'free' && (
                        <button
                            className="cancel-subscription-btn"
                            onClick={handleCancelSubscription}
                        >
                            Cancel Subscription
                        </button>
                    )}
                </div>

                {/* Available Plans */}
                <div className="available-plans">
                    <h2>Available Plans</h2>
                    <div className="plans-grid">
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                className={`plan-card ${currentPlan?.id === plan.id ? 'current-plan' : ''}`}
                            >
                                <div className="plan-header">
                                    <h3>{plan.name}</h3>
                                    {currentPlan?.id === plan.id && (
                                        <span className="current-badge">Current Plan</span>
                                    )}
                                </div>
                                <div className="plan-price">
                                    <span className="currency">₹</span>
                                    <span className="amount">{plan.price}</span>
                                    <span className="period">/month</span>
                                </div>
                                <div className="plan-features">
                                    <div className="feature">
                                        <span className="feature-label">Watch Time:</span>
                                        <span className="feature-value">{formatWatchTime(plan.watchTimeLimit)}</span>
                                    </div>
                                    <div className="feature">
                                        <span className="feature-label">Description:</span>
                                        <span className="feature-value">{plan.description}</span>
                                    </div>
                                </div>
                                {currentPlan?.id !== plan.id && (
                                    <button
                                        className="select-plan-btn"
                                        onClick={() => handleSelectPlan(plan)}
                                    >
                                        {plan.id === 'free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Modal */}
                {showPaymentModal && selectedPlan && (
                    <div className="payment-modal-overlay">
                        <div className="payment-modal">
                            <button
                                className="close-modal-btn"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedPlan(null);
                                    setPaymentSuccess(false);
                                }}
                            >
                                &times;
                            </button>

                            {paymentSuccess ? (
                                <div className="payment-success">
                                    <h2>Payment Successful!</h2>
                                    <p>Your subscription to {selectedPlan.name} has been processed successfully.</p>
                                    <p>An invoice has been generated for your subscription.</p>
                                    <p>An email with your invoice details has been sent to: <strong>{currentuser?.result?.email}</strong></p>
                                    <p>Please check your inbox (and spam folder) for the invoice email.</p>
                                    <div className="invoice-confirmation">
                                        <p>Invoice ID: <strong>{paymentSuccess?.invoiceId || 'N/A'}</strong></p>
                                        <p>Amount: <strong>₹{selectedPlan.price}</strong></p>
                                        <p>Valid until: <strong>{paymentSuccess?.validUntil ? new Date(paymentSuccess.validUntil).toLocaleDateString() : 'N/A'}</strong></p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2>Subscribe to {selectedPlan.name}</h2>
                                    {error && (
                                        <div className="payment-error">
                                            <p>{error}</p>
                                        </div>
                                    )}
                                    <div className="payment-details">
                                        <div className="payment-item">
                                            <span className="payment-label">Plan:</span>
                                            <span className="payment-value">{selectedPlan.name}</span>
                                        </div>
                                        <div className="payment-item">
                                            <span className="payment-label">Price:</span>
                                            <span className="payment-value">₹{selectedPlan.price}/month</span>
                                        </div>
                                        <div className="payment-item">
                                            <span className="payment-label">Watch Time:</span>
                                            <span className="payment-value">{formatWatchTime(selectedPlan.watchTimeLimit)}</span>
                                        </div>
                                    </div>

                                    {selectedPlan.price > 0 ? (
                                        <div className="payment-form">
                                            <div className="form-group">
                                                <label>Card Number</label>
                                                <input type="text" placeholder="1234 5678 9012 3456" disabled={paymentProcessing} />
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Expiry Date</label>
                                                    <input type="text" placeholder="MM/YY" disabled={paymentProcessing} />
                                                </div>
                                                <div className="form-group">
                                                    <label>CVV</label>
                                                    <input type="text" placeholder="123" disabled={paymentProcessing} />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Name on Card</label>
                                                <input type="text" placeholder="John Doe" disabled={paymentProcessing} />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="free-plan-note">You are switching to the Free Plan. No payment required.</p>
                                    )}

                                    <button
                                        className="process-payment-btn"
                                        onClick={handlePayment}
                                        disabled={paymentProcessing}
                                    >
                                        {paymentProcessing ? 'Processing...' : selectedPlan.price > 0 ? 'Pay Now' : 'Confirm'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Subscription;

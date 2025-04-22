# Email Setup for Subscription Invoices

This document explains how to set up the email functionality for sending subscription invoices.

## Configuration

1. Open the `.env` file in the `Server` directory
2. Update the following variables with your email credentials:

```
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## Using Gmail

If you're using Gmail, you need to create an App Password:

1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification
3. At the bottom, click on "App passwords"
4. Select "Mail" as the app and "Other" as the device
5. Enter a name (e.g., "Video Platform")
6. Click "Generate"
7. Use the generated 16-character password as your `EMAIL_PASSWORD` in the `.env` file

## Testing

To test if the email functionality is working:

1. Set up the email configuration as described above
2. Start the server
3. Log in to the application
4. Navigate to the Subscription page
5. Subscribe to any paid plan (Bronze, Silver, or Gold)
6. Complete the payment process
7. Check your email for the invoice

## Troubleshooting

If you're not receiving emails:

1. Check the server console for any error messages
2. Verify that your email credentials are correct
3. If using Gmail, make sure you've created an App Password correctly
4. Check your spam folder
5. Ensure that your email provider allows sending emails from applications

## Notes

- The email functionality uses the nodemailer package
- The user's email address is taken from their account information
- Invoices are sent immediately after successful payment
- The invoice includes details about the subscription plan, amount, and validity period

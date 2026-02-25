# Email Setup Guide

## The Issue

If emails aren't being sent, check the following:

## 1. Resend API Key

Make sure you have a valid Resend API key in your `.env` file:

```env
RESEND_API_KEY=re_your_actual_api_key_here
```

Get your API key from: https://resend.com/api-keys

## 2. FROM_EMAIL Domain Verification

The `FROM_EMAIL` must use a domain that's verified in Resend:

```env
FROM_EMAIL=this-week@event-newsletter.com
```

**Important:** 
- The domain `event-newsletter.com` must be verified in your Resend dashboard
- You can't use `@example.com` or unverified domains
- For testing, Resend provides a test domain: `onboarding@resend.dev` (but this may have limitations)

## 3. Verify Domain in Resend

1. Go to https://resend.com/domains
2. Add your domain
3. Add the DNS records they provide
4. Wait for verification (can take a few minutes to 24 hours)

## 4. Check Server Logs

After restarting your server, when you try to send an email, check the console for:
- "sendEmail called:" - confirms the function was called
- "RESEND_API_KEY exists:" - confirms the key is detected
- "FROM_EMAIL:" - shows the email address being used
- "Email sent successfully:" - confirms it worked
- Any error messages with details

## 5. Common Issues

**"RESEND_API_KEY not configured"**
- Add your API key to `.env`
- Restart the server

**"FROM_EMAIL not configured or using placeholder"**
- Set a valid email address
- Make sure the domain is verified in Resend

**"Failed to send email: Domain not verified"**
- Verify your domain in Resend dashboard
- Wait for DNS propagation

**Email sent but not received:**
- Check spam folder
- Verify the `to` email address is correct
- Check Resend dashboard for delivery status

## Testing

You can test the email service by:
1. Generating a newsletter
2. Clicking "Send" on the newsletter
3. Checking the server console for detailed logs
4. Checking your email (including spam)

The enhanced logging will show exactly what's happening at each step.


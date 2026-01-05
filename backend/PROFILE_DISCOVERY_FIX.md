# Fix for Profile Discovery 400 Error

## The Problem

The 400 error is happening because the `PERPLEXITY_API_KEY` is not set in your `.env` file.

## The Solution

1. **Get a Perplexity API Key:**
   - Go to https://www.perplexity.ai/
   - Sign up or log in
   - Navigate to API settings to get your API key

2. **Add it to your `.env` file:**
   
   Open `backend/.env` and update this line:
   ```env
   PERPLEXITY_API_KEY=your-perplexity-api-key-here
   ```
   
   Replace `your-perplexity-api-key-here` with your actual API key.

3. **Restart your server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

## Alternative: Test Without API Key

If you want to test the rest of the app without the API key, you can temporarily modify the code to return mock data, but for production you'll need a real API key.

## What Changed

I've improved error handling so you'll now see clearer error messages:
- If API key is missing: "PERPLEXITY_API_KEY not configured..."
- If API key is invalid: "Invalid Perplexity API key..."
- If API call fails: More specific error messages

After adding the API key and restarting, profile discovery should work!


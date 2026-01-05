import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendEmail(data: {
  to: string;
  subject: string;
  html: string;
}) {
  console.log('sendEmail called:', { to: data.to, subject: data.subject });
  console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY);
  console.log('FROM_EMAIL:', FROM_EMAIL);

  if (!RESEND_API_KEY || RESEND_API_KEY === 'your-resend-api-key-here') {
    const error = 'RESEND_API_KEY not configured. Please add your Resend API key to the .env file. Get one at https://resend.com/';
    console.error(error);
    throw new Error(error);
  }

  if (!FROM_EMAIL || FROM_EMAIL === 'noreply@example.com') {
    const error = 'FROM_EMAIL not configured or using placeholder. Please set a valid FROM_EMAIL in .env. The domain must be verified in Resend.';
    console.error(error);
    throw new Error(error);
  }

  if (!resend) {
    throw new Error('Resend client not initialized');
  }

  try {
    console.log('Sending email via Resend...');
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: data.subject,
      html: data.html,
    });
    
    console.log('Email sent successfully:', result);
    return result;
  } catch (error: any) {
    console.error('Error sending email - full error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.data) {
      const errorMessage = error.response.data.message || JSON.stringify(error.response.data);
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
    
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
}


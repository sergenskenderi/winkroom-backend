const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
    this.init();
  }

  async init() {
    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'sergi.skenderi2017@gmail.com',
        pass: process.env.SMTP_PASS || 'hxbc wveo cqqt ftpf'
      }
    });

    // Load email templates
    await this.loadTemplates();
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      // Email verification template
      const verificationTemplate = await fs.readFile(
        path.join(templatesDir, 'email-verification.hbs'),
        'utf8'
      );
      this.templates.verification = handlebars.compile(verificationTemplate);

      // Password reset template
      const resetTemplate = await fs.readFile(
        path.join(templatesDir, 'password-reset.hbs'),
        'utf8'
      );
      this.templates.reset = handlebars.compile(resetTemplate);

      // Welcome template
      const welcomeTemplate = await fs.readFile(
        path.join(templatesDir, 'welcome.hbs'),
        'utf8'
      );
      this.templates.welcome = handlebars.compile(welcomeTemplate);

    } catch (error) {
      console.log('Using default email templates');
      // Fallback to default templates if files don't exist
      this.createDefaultTemplates();
    }
  }

  createDefaultTemplates() {
    // Default email verification template
    this.templates.verification = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - WinkRoom</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to WinkRoom!</h1>
            <p>Verify your email address to get started</p>
          </div>
          <div class="content">
            <h2>Hi {{fullName}},</h2>
            <p>Thank you for signing up for WinkRoom! To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{{verificationUrl}}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <p>If you didn't create an account with WinkRoom, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 WinkRoom. All rights reserved.</p>
            <p>This email was sent to {{email}}</p>
          </div>
        </div>
      </body>
      </html>
    `);

    // Default password reset template
    this.templates.reset = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - WinkRoom</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
            <p>Secure your account with a new password</p>
          </div>
          <div class="content">
            <h2>Hi {{fullName}},</h2>
            <p>We received a request to reset your password for your WinkRoom account. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="{{resetUrl}}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #ff6b6b;">{{resetUrl}}</p>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 WinkRoom. All rights reserved.</p>
            <p>This email was sent to {{email}}</p>
          </div>
        </div>
      </body>
      </html>
    `);

    // Default welcome template
    this.templates.welcome = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to WinkRoom!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to WinkRoom!</h1>
            <p>Your account has been successfully verified</p>
          </div>
          <div class="content">
            <h2>Hi {{fullName}},</h2>
            <p>Congratulations! Your email has been successfully verified and your WinkRoom account is now active.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Connect with other users</li>
              <li>Join rooms and start conversations</li>
              <li>Explore all the features of WinkRoom</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="{{loginUrl}}" class="button">Get Started</a>
            </div>
            
            <p>If you have any questions or need help, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 WinkRoom. All rights reserved.</p>
            <p>This email was sent to {{email}}</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  async sendEmail(to, subject, html, text = null) {
    // Check if we're in test mode (no SMTP credentials configured)
    if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com')) {
      return await this.sendTestEmail(to, subject, html, text);
    }

    try {
      const mailOptions = {
        from: `"WinkRoom" <${process.env.SMTP_USER || 'noreply@winkroom.com'}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      // Fallback to test mode if email fails
      console.log('Falling back to test mode...');
      return await this.sendTestEmail(to, subject, html, text);
    }
  }

  htmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async sendVerificationEmail(email, fullName, token) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${token}`;
    
    const html = this.templates.verification({
      fullName,
      email,
      verificationUrl
    });

    return await this.sendEmail(
      email,
      'Verify Your Email - WinkRoom',
      html
    );
  }

  async sendPasswordResetEmail(email, fullName, token) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;
    
    const html = this.templates.reset({
      fullName,
      email,
      resetUrl
    });

    return await this.sendEmail(
      email,
      'Reset Your Password - WinkRoom',
      html
    );
  }

  async sendWelcomeEmail(email, fullName) {
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;
    
    const html = this.templates.welcome({
      fullName,
      email,
      loginUrl
    });

    return await this.sendEmail(
      email,
      'Welcome to WinkRoom!',
      html
    );
  }

  // For testing purposes - send to console instead of email
  async sendTestEmail(to, subject, html, text = null) {
    console.log('\n📧 TEST EMAIL SENT:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text || this.htmlToText(html));
    console.log('HTML Preview:', html.substring(0, 200) + '...');
    console.log('📧 END TEST EMAIL\n');
    
    return { messageId: 'test-' + Date.now() };
  }
}

module.exports = new EmailService(); 
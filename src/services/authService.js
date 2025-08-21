const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('./emailService');

class AuthService {
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async register(userData) {
    const { email, fullName, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const emailVerificationToken = this.generateEmailVerificationToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user (auto-verified for testing)
    const user = new User({
      email,
      fullName,
      password,
      authType: 'manual',
      isEmailVerified: true, // Auto-verify for testing
      // emailVerificationToken, // Commented out for testing
      // emailVerificationExpires // Commented out for testing
    });

    await user.save();

    const token = this.generateToken(user._id);

    // Send welcome email (for testing - user is already verified)
    try {
      await emailService.sendWelcomeEmail(email, fullName);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't fail registration if email fails
    }

    return {
      user: user.getPublicProfile(),
      token,
      message: 'Registration successful! Your account is ready to use.'
    };
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.authType !== 'manual') {
      throw new Error('Please use social login for this account');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    user.lastLoginAt = new Date();
    user.isOnline = true;
    await user.save();

    const token = this.generateToken(user._id);

    return {
      user: user.getPublicProfile(),
      token
    };
  }

  async socialLogin(provider, profile) {
    let user = await User.findOrCreateBySocialProfile(provider, profile);
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    user.lastLoginAt = new Date();
    user.isOnline = true;
    await user.save();

    const token = this.generateToken(user._id);

    return {
      user: user.getPublicProfile(),
      token
    };
  }

  async verifyEmail(token) {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.fullName);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't fail verification if email fails
    }

    return user.getPublicProfile();
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    const passwordResetToken = this.generatePasswordResetToken();
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, user.fullName, passwordResetToken);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      // Don't fail if email fails
    }

    return { message: 'Password reset instructions sent to your email.' };
  }

  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return user.getPublicProfile();
  }

  async getUserByToken(token) {
    const decoded = this.verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return user.getPublicProfile();
  }

  async logout(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.isOnline = false;
      user.lastSeenAt = new Date();
      await user.save();
    }
  }
}

module.exports = new AuthService(); 
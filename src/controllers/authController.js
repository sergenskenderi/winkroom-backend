const authService = require('../services/authService');
const emailService = require('../services/emailService');
const User = require('../models/User');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { email, fullName, password } = req.body;

      // Validation
      if (!email || !fullName || !password) {
        return res.status(400).json({
          error: 'Email, full name, and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long'
        });
      }

      const result = await authService.register({ email, fullName, password });

      res.status(201).json({
        message: 'User registered successfully! Your account is ready to use.',
        data: result
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      const result = await authService.login(email, password);

      res.json({
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  // Social login
  async socialLogin(req, res) {
    try {
      const { provider, profile } = req.body;

      if (!provider || !profile) {
        return res.status(400).json({
          error: 'Provider and profile are required'
        });
      }

      const result = await authService.socialLogin(provider, profile);

      res.json({
        message: 'Social login successful',
        data: result
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          error: 'Verification token is required'
        });
      }

      const user = await authService.verifyEmail(token);

      res.json({
        message: 'Email verified successfully',
        data: { user }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Email is required'
        });
      }

      const result = await authService.forgotPassword(email);

      res.json({
        message: 'Password reset instructions sent to your email',
        data: result
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          error: 'Token and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long'
        });
      }

      const user = await authService.resetPassword(token, newPassword);

      res.json({
        message: 'Password reset successfully',
        data: { user }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      res.json({
        message: 'Profile retrieved successfully',
        data: { user: req.user }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { fullName, bio, phoneNumber, profilePicture } = req.body;
      const userId = req.user._id;

      const updateData = {};
      if (fullName) updateData.fullName = fullName;
      if (bio !== undefined) updateData.bio = bio;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        message: 'Profile updated successfully',
        data: { user: user.getPublicProfile() }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const userId = req.user._id;
      await authService.logout(userId);

      res.json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete account
  async deleteAccount(req, res) {
    try {
      const userId = req.user._id;
      
      // Soft delete - set isActive to false
      await User.findByIdAndUpdate(userId, { isActive: false });

      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Resend email verification
  async resendVerification(req, res) {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (user.isEmailVerified) {
        return res.status(400).json({
          error: 'Email is already verified'
        });
      }

      // Generate new verification token
      const emailVerificationToken = authService.generateEmailVerificationToken();
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      user.emailVerificationToken = emailVerificationToken;
      user.emailVerificationExpires = emailVerificationExpires;
      await user.save();

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, user.fullName, emailVerificationToken);
      } catch (error) {
        console.error('Error sending verification email:', error);
      }

      res.json({
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Test email functionality
  async testEmail(req, res) {
    try {
      const { email, fullName, type } = req.body;

      if (!email || !fullName || !type) {
        return res.status(400).json({
          error: 'Email, full name, and type are required'
        });
      }

      let result;
      switch (type) {
        case 'verification':
          const verificationToken = authService.generateEmailVerificationToken();
          result = await emailService.sendVerificationEmail(email, fullName, verificationToken);
          break;
        case 'reset':
          const resetToken = authService.generatePasswordResetToken();
          result = await emailService.sendPasswordResetEmail(email, fullName, resetToken);
          break;
        case 'welcome':
          result = await emailService.sendWelcomeEmail(email, fullName);
          break;
        default:
          return res.status(400).json({
            error: 'Invalid email type. Use: verification, reset, or welcome'
          });
      }

      res.json({
        message: `${type} email sent successfully`,
        data: { result }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuthController(); 
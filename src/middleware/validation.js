const validateRegistration = (req, res, next) => {
  const { email, fullName, password , confirmPassword} = req.body;

  const errors = [];

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Full name validation
  if (!fullName) {
    errors.push('Full name is required');
  } else if (fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  } else if (fullName.trim().length > 100) {
    errors.push('Full name must be less than 100 characters');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateSocialLogin = (req, res, next) => {
  const { provider, profile } = req.body;

  const errors = [];

  // Provider validation
  const validProviders = ['google', 'apple', 'facebook', 'twitter', 'linkedin'];
  if (!provider) {
    errors.push('Provider is required');
  } else if (!validProviders.includes(provider)) {
    errors.push('Invalid provider. Must be one of: ' + validProviders.join(', '));
  }

  // Profile validation
  if (!profile) {
    errors.push('Profile is required');
  } else {
    if (!profile.id) {
      errors.push('Profile ID is required');
    }
    // Email and name are optional for social login
    // They can be empty/null and will be handled in the service
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validatePasswordReset = (req, res, next) => {
  const { newPassword } = req.body;

  const errors = [];

  if (!newPassword) {
    errors.push('New password is required');
  } else if (newPassword.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else if (newPassword.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const { fullName, bio, phoneNumber } = req.body;

  const errors = [];

  // Full name validation
  if (fullName !== undefined) {
    if (fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    } else if (fullName.trim().length > 100) {
      errors.push('Full name must be less than 100 characters');
    }
  }

  // Bio validation
  if (bio !== undefined && bio.length > 500) {
    errors.push('Bio must be less than 500 characters');
  }

  // Phone number validation
  if (phoneNumber !== undefined && phoneNumber) {
    if (!/^\+?[\d\s-()]+$/.test(phoneNumber)) {
      errors.push('Please enter a valid phone number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateSocialLogin,
  validatePasswordReset,
  validateProfileUpdate
}; 
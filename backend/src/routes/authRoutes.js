const express = require('express');
const { authenticateUser, optionalAuth, logUserActivity, getUserProfile, updateUserProfile, supabase } = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @route GET /api/auth/debug
 * @desc Debug endpoint to check auth system status
 */
router.get('/debug', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const hasToken = !!authHeader;
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      hasAuthHeader: hasToken,
      supabaseUrl: process.env.SUPABASE_URL || 'Not configured',
      hasSupabaseKey: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY),
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    };

    if (hasToken) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: user, error } = await supabase.auth.getUser(token);
        debugInfo.tokenValid = !error;
        debugInfo.userId = user?.user?.id || null;
        debugInfo.userEmail = user?.user?.email || null;
      } catch (err) {
        debugInfo.tokenValid = false;
        debugInfo.tokenError = err.message;
      }
    }

    res.status(200).json({
      success: true,
      debug: debugInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        message: 'Debug endpoint failed'
      }
    });
  }
});

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || email.split('@')[0]
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // In development mode, auto-confirm the email
    if (process.env.NODE_ENV === 'development' && data.user && !data.session) {
      try {
        // For development, we'll return success and let the user sign in immediately
        return res.status(201).json({
          success: true,
          message: 'Account created successfully! You can now sign in. (Email confirmation skipped in development)',
          user: {
            id: data.user.id,
            email: data.user.email,
            email_confirmed: true
          }
        });
      } catch (devError) {
        console.log('Dev auto-confirm failed, proceeding with normal flow:', devError);
      }
    }

    // If user is created but not confirmed (email confirmation required)
    if (data.user && !data.session) {
      return res.status(200).json({
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed: false
        }
      });
    }

    // If user is created and confirmed
    if (data.user && data.session) {
      // Log the signup activity
      await logUserActivity(data.user.id, 'user_signup', {
        email: data.user.email,
        signup_method: 'email'
      });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      });
    }

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during signup'
    });
  }
});

/**
 * @route POST /api/auth/signin
 * @desc Sign in user
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Development bypass for test credentials
    if (process.env.NODE_ENV === 'development' && email === 'test@dev.local' && password === 'test123') {
      console.log('[DEV] Using development bypass for test@dev.local');
      
      const mockSession = {
        access_token: 'dev_token_' + Date.now(),
        refresh_token: 'dev_refresh_' + Date.now(),
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      return res.status(200).json({
        success: true,
        message: 'Signed in successfully (development mode)!',
        user: {
          id: 'dev-user-' + Date.now(),
          email: 'test@dev.local',
          full_name: 'Test Development User',
          avatar_url: null,
          plan_type: 'free',
          storage_used: 0,
          storage_quota: 5368709120
        },
        session: mockSession
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // In development mode, handle email not confirmed error specially
      if (process.env.NODE_ENV === 'development' && error.message === 'Email not confirmed') {
        // For development, we'll create a mock session for unconfirmed users
        // First try to get the user by email
        try {
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users.users.find(u => u.email === email);
          
          if (user) {
            // Create a mock session for development
            const mockSession = {
              access_token: 'dev_token_' + Date.now(),
              refresh_token: 'dev_refresh_' + Date.now(),
              expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            };

            // Log the development signin
            console.log(`[DEV] Email not confirmed signin for: ${email}`);

            return res.status(200).json({
              success: true,
              message: 'Signed in successfully (development mode - email confirmation bypassed)!',
              user: {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'Dev User',
                avatar_url: null,
                plan_type: 'free',
                storage_used: 0,
                storage_quota: 5368709120
              },
              session: mockSession
            });
          }
        } catch (devError) {
          console.error('Development signin fallback failed:', devError);
        }
      }

      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    // Get user profile
    const profile = await getUserProfile(data.user.id);

    // Log the signin activity
    await logUserActivity(data.user.id, 'user_signin', {
      email: data.user.email,
      signin_method: 'email'
    });

    res.status(200).json({
      success: true,
      message: 'Signed in successfully!',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name || data.user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url,
        plan_type: profile?.plan_type || 'free',
        storage_used: profile?.storage_used || 0,
        storage_quota: profile?.storage_quota || 5368709120
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during signin'
    });
  }
});

/**
 * @route POST /api/auth/signout
 * @desc Sign out user
 */
router.post('/signout', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Log the signout activity
    await logUserActivity(req.user.id, 'user_signout', {
      email: req.user.email
    });

    res.status(200).json({
      success: true,
      message: 'Signed out successfully!'
    });

  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during signout'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 */
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        plan_type: profile.plan_type,
        storage_used: profile.storage_used,
        storage_quota: profile.storage_quota,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 */
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { full_name, avatar_url } = req.body;
    const updates = {};

    if (full_name !== undefined) updates.full_name = full_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    const result = await updateUserProfile(req.user.id, updates);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.message || 'Failed to update profile'
      });
    }

    // Log the profile update activity
    await logUserActivity(req.user.id, 'profile_update', {
      updated_fields: Object.keys(updates)
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: result.data
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/auth/activity
 * @desc Get user activity log
 */
router.get('/activity', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('user_activity_log')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      activities: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/auth/callback
 * @desc Handle email confirmation callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { token_hash, type, next } = req.query;

    if (type === 'email' && token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email'
      });

      if (error) {
        console.error('Email verification error:', error);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=verification_failed`);
      }

      if (data.user) {
        // Log the email confirmation activity
        await logUserActivity(data.user.id, 'email_confirmed', {
          email: data.user.email
        });

        // Redirect to login with success message
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?message=email_confirmed`);
      }
    }

    // Default redirect
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=callback_failed`);
  }
});

/**
 * @route GET /api/auth/debug
 * @desc Debug authentication status
 */
router.get('/debug', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    res.status(200).json({
      success: true,
      debug: {
        hasAuthHeader: !!authHeader,
        hasToken: !!token,
        token: token ? `${token.substring(0, 10)}...` : null,
        environment: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.SUPABASE_URL || 'not configured',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug endpoint error'
    });
  }
});

/**
 * @route POST /api/auth/confirm-dev
 * @desc Development-only route to manually confirm user email
 */
router.post('/confirm-dev', async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'This endpoint is only available in development mode'
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Get the user by email from Supabase
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      return res.status(400).json({
        success: false,
        error: fetchError.message
      });
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user to confirmed
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User email confirmed successfully (development mode)',
      user: {
        id: user.id,
        email: user.email,
        email_confirmed: true
      }
    });

  } catch (error) {
    console.error('Confirm dev error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware to verify user authentication
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
        code: 'UNAUTHORIZED'
      });
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Handle development mock tokens
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev_token_')) {
      // Extract email from development token (simple approach)
      // In a real app, you'd use proper JWT with user info
      console.log('[DEV] Using development mock token');
      
      // For development, create a mock user
      req.user = {
        id: 'dev-user-' + Date.now(),
        email: 'admin@studyai.dev', // Default dev user
        full_name: 'Development User',
        avatar_url: null,
        created_at: new Date().toISOString()
      };

      return next();
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Add user information to the request object
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at
    };

    // Log user activity
    await logUserActivity(req.user.id, 'api_access', {
      endpoint: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    }, req);

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Middleware for optional authentication (user can be logged in or not)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          avatar_url: user.user_metadata?.avatar_url,
          created_at: user.created_at
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Continue without user for optional auth
    next();
  }
};

/**
 * Log user activity to the database
 */
const logUserActivity = async (userId, actionType, actionDetails = {}, req = null) => {
  try {
    const activityData = {
      user_id: userId,
      action_type: actionType,
      action_details: actionDetails,
      created_at: new Date().toISOString()
    };

    // Add IP and user agent if request is available
    if (req) {
      activityData.ip_address = req.ip || req.connection.remoteAddress;
      activityData.user_agent = req.get('User-Agent');
    }

    const { error } = await supabase
      .from('user_activity_log')
      .insert(activityData);

    if (error) {
      console.error('Failed to log user activity:', error);
    }
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

/**
 * Get user profile from database
 */
const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { success: false, error };
  }
};

/**
 * Check user storage quota
 */
const checkStorageQuota = async (userId, additionalSize = 0) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      return { withinQuota: false, error: 'User profile not found' };
    }

    const totalUsed = (profile.storage_used || 0) + additionalSize;
    const quota = profile.storage_quota || 5368709120; // 5GB default

    return {
      withinQuota: totalUsed <= quota,
      storageUsed: totalUsed,
      storageQuota: quota,
      availableSpace: quota - totalUsed
    };
  } catch (error) {
    console.error('Error checking storage quota:', error);
    return { withinQuota: false, error: 'Storage quota check failed' };
  }
};

/**
 * Update user storage usage
 */
const updateStorageUsage = async (userId, sizeChange) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      return { success: false, error: 'User profile not found' };
    }

    const newStorageUsed = Math.max(0, (profile.storage_used || 0) + sizeChange);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        storage_used: newStorageUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating storage usage:', error);
      return { success: false, error };
    }

    return { success: true, newStorageUsed };
  } catch (error) {
    console.error('Error in updateStorageUsage:', error);
    return { success: false, error };
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
  logUserActivity,
  getUserProfile,
  updateUserProfile,
  checkStorageQuota,
  updateStorageUsage,
  supabase
};
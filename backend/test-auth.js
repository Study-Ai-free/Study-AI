// Simple auth test script
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ygietpskldccuqrhpsyl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaWV0cHNrbGRjY3Vxcmhwc3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgyMDQsImV4cCI6MjA3MzUxNDIwNH0.CPeY5MNyKfIyshWGE3ICEsTVnW_ZCMY_zOqOJYuAWlQ'
);

async function testAuth() {
  console.log('Testing Supabase authentication...');
  
  // Try to create a user
  const { data, error } = await supabase.auth.signUp({
    email: 'test123@test.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User'
      }
    }
  });

  if (error) {
    console.error('Signup error:', error.message);
  } else {
    console.log('Signup result:', {
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      session: data.session ? 'present' : 'null'
    });
  }
}

testAuth();
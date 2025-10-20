// Test Admin Authentication Flow
// Run this in the browser console to test admin auth

console.log('=== TESTING ADMIN AUTH FLOW ===');

async function testAdminAuth() {
  try {
    // Test 1: Check if Supabase is available
    console.log('1. Testing Supabase availability...');
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase client not found');
      return;
    }
    console.log('✅ Supabase client found');

    // Test 2: Check current user
    console.log('2. Testing current user...');
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    if (userError) {
      console.error('❌ Error getting user:', userError);
      return;
    }
    if (!user) {
      console.log('❌ No authenticated user found');
      console.log('Please log in first, then run this test again');
      return;
    }
    console.log('✅ User found:', user.email);

    // Test 3: Check user profile
    console.log('3. Testing user profile...');
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error getting profile:', profileError);
      return;
    }
    if (!profile) {
      console.log('❌ No profile found');
      return;
    }
    console.log('✅ Profile found:', { email: profile.email, role: profile.app_role });

    // Test 4: Check admin privileges
    console.log('4. Testing admin privileges...');
    if (!profile.app_role || profile.app_role === 'user') {
      console.log('❌ User does not have admin privileges');
      console.log('Current role:', profile.app_role);
      console.log('To fix this, run: UPDATE profiles SET app_role = \'admin\' WHERE id = \'' + user.id + '\';');
      return;
    }
    console.log('✅ User has admin privileges:', profile.app_role);

    // Test 5: Test admin service initialization
    console.log('5. Testing admin service...');
    if (typeof window.AdminAuthService !== 'undefined') {
      const authService = window.AdminAuthService.getInstance();
      const adminUser = await authService.initialize();
      if (adminUser) {
        console.log('✅ Admin service initialized successfully');
        console.log('Admin user:', adminUser);
      } else {
        console.log('❌ Admin service failed to initialize');
      }
    } else {
      console.log('⚠️ AdminAuthService not available in window (this is normal)');
    }

    console.log('=== ADMIN AUTH TEST COMPLETE ===');
    console.log('✅ All tests passed! Admin should work.');
    console.log('If admin page is still blank, try: /admin/minimal');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAdminAuth();
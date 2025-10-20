// Admin Blank Page Diagnostic Script
// Run this in the browser console when on the admin page

console.log('=== ADMIN BLANK PAGE DIAGNOSTIC ===');

// Check if we're on the admin page
console.log('Current URL:', window.location.href);

// Check if React is loaded
console.log('React loaded:', typeof React !== 'undefined');

// Check if the admin context is working
const adminContext = document.querySelector('[data-admin-context]');
console.log('Admin context element found:', !!adminContext);

// Check for any JavaScript errors
console.log('Checking for errors...');

// Check if the admin components are rendered
const adminElements = {
  adminEntry: document.querySelector('[data-testid="admin-entry"]'),
  adminLayout: document.querySelector('[data-testid="admin-layout"]'),
  adminDashboard: document.querySelector('[data-testid="admin-dashboard"]'),
  loadingSkeleton: document.querySelector('[data-testid="loading-skeleton"]'),
  errorAlert: document.querySelector('[role="alert"]')
};

console.log('Admin elements found:', adminElements);

// Check local storage for any admin-related data
const adminData = {
  supabaseSession: localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token'),
  adminSession: localStorage.getItem('admin-session'),
  userRole: localStorage.getItem('user-role')
};

console.log('Admin data in storage:', adminData);

// Check if Supabase is connected
if (window.supabase) {
  console.log('Supabase client found');
  window.supabase.auth.getUser().then(({ data, error }) => {
    console.log('Current user:', data.user?.email);
    console.log('Auth error:', error);
  });
} else {
  console.log('Supabase client not found');
}

// Check for any network requests
console.log('Network requests (check Network tab for admin-related requests)');

// Check if the page is completely blank
const bodyContent = document.body.innerHTML;
console.log('Page has content:', bodyContent.length > 100);
console.log('Body classes:', document.body.className);

// Check for any React error boundaries
const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
console.log('Error boundaries found:', errorBoundaries.length);

console.log('=== END DIAGNOSTIC ===');
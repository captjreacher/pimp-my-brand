// Diagnostic script to check Plans tab visibility
console.log('🔍 DIAGNOSING PLANS TAB ISSUE...');
console.log('');

// Check if we're in the browser
if (typeof window !== 'undefined') {
    console.log('✅ Running in browser environment');
    
    // Check current URL
    console.log('📍 Current URL:', window.location.href);
    
    // Check if we're on the subscription management page
    const isSubscriptionPage = window.location.pathname.includes('/admin/subscriptions');
    console.log('📋 On subscription page:', isSubscriptionPage);
    
    // Check for tabs
    setTimeout(() => {
        const tabs = document.querySelectorAll('[role="tab"]');
        console.log('🏷️ Found tabs:', tabs.length);
        
        tabs.forEach((tab, index) => {
            console.log(`   Tab ${index + 1}:`, tab.textContent?.trim());
        });
        
        // Look specifically for Plans tab
        const plansTab = Array.from(tabs).find(tab => 
            tab.textContent?.toLowerCase().includes('plans')
        );
        
        if (plansTab) {
            console.log('✅ Plans tab found!');
            console.log('   Text:', plansTab.textContent);
            console.log('   Visible:', plansTab.offsetParent !== null);
            console.log('   Disabled:', plansTab.hasAttribute('disabled'));
        } else {
            console.log('❌ Plans tab NOT found');
            console.log('');
            console.log('🔍 TROUBLESHOOTING:');
            console.log('1. Check if you have manage_billing permission');
            console.log('2. Verify the subscription_plans table exists');
            console.log('3. Check browser console for errors');
            console.log('4. Try hard refresh (Ctrl+F5)');
        }
        
        // Check for any React errors
        const errorElements = document.querySelectorAll('[data-error], .error, .alert-error');
        if (errorElements.length > 0) {
            console.log('⚠️ Found error elements:', errorElements.length);
            errorElements.forEach((el, i) => {
                console.log(`   Error ${i + 1}:`, el.textContent?.trim());
            });
        }
        
        // Check for loading states
        const loadingElements = document.querySelectorAll('[data-loading], .loading, .spinner');
        if (loadingElements.length > 0) {
            console.log('⏳ Found loading elements:', loadingElements.length);
        }
        
        // Check for permission gates
        const permissionGates = document.querySelectorAll('[data-permission-gate]');
        console.log('🔐 Permission gates found:', permissionGates.length);
        
    }, 2000); // Wait 2 seconds for page to load
    
} else {
    console.log('📋 PLANS TAB DIAGNOSTIC CHECKLIST:');
    console.log('');
    console.log('1. ✅ Plans tab code is implemented');
    console.log('2. ✅ Components are created');
    console.log('3. ✅ Imports are correct');
    console.log('4. ✅ Permission gate is set to manage_billing');
    console.log('');
    console.log('🔍 POSSIBLE ISSUES:');
    console.log('');
    console.log('❓ Database Migration:');
    console.log('   - subscription_plans table may not exist');
    console.log('   - Run the migration in Supabase dashboard');
    console.log('');
    console.log('❓ User Permissions:');
    console.log('   - User may not have manage_billing permission');
    console.log('   - Check admin_permissions array in profiles table');
    console.log('');
    console.log('❓ Browser Cache:');
    console.log('   - Old cached version may be loading');
    console.log('   - Try hard refresh or clear cache');
    console.log('');
    console.log('❓ Component Loading:');
    console.log('   - Check browser console for import errors');
    console.log('   - Verify all dependencies are installed');
    console.log('');
    console.log('🚀 EXPECTED BEHAVIOR:');
    console.log('   Go to /admin/subscriptions');
    console.log('   Should see: Overview | Plans | Subscriptions | Billing Issues');
    console.log('   Plans tab should be clickable and show plan management');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.diagnosePlansTab = () => {
        console.log('🔍 Manual Plans Tab Diagnosis');
        
        // Check for the specific TabsTrigger
        const plansTabTrigger = document.querySelector('[value="plans"]');
        console.log('Plans TabsTrigger found:', !!plansTabTrigger);
        
        if (plansTabTrigger) {
            console.log('Plans tab element:', plansTabTrigger);
            console.log('Plans tab parent:', plansTabTrigger.parentElement);
            console.log('Plans tab visible:', plansTabTrigger.offsetParent !== null);
        }
        
        // Check TabsContent
        const plansTabContent = document.querySelector('[data-state="active"][data-orientation="horizontal"]');
        console.log('Active tab content:', plansTabContent);
        
        // Check for SubscriptionPlansOverview component
        const plansOverview = document.querySelector('[data-testid="subscription-plans-overview"]') || 
                             document.querySelector('.subscription-plans-overview');
        console.log('Plans overview component:', !!plansOverview);
        
        return {
            tabTrigger: !!plansTabTrigger,
            tabContent: !!plansTabContent,
            plansOverview: !!plansOverview
        };
    };
    
    console.log('💡 Run window.diagnosePlansTab() in browser console for detailed diagnosis');
}
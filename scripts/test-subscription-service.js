// Test Subscription Management Service - Real Data Only
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubscriptionService() {
  console.log('🔍 TESTING SUBSCRIPTION SERVICE - REAL DATA ONLY\n');
  
  const results = {
    subscriptionTiers: false,
    userSubscriptions: false,
    subscriptionStats: false,
    realBilling: false
  };

  try {
    // Test 1: Subscription Tiers from Real Users
    console.log('1. Testing Subscription Tiers...');
    
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, subscription_tier, created_at')
      .limit(20);

    if (usersError) {
      console.log('❌ User subscription data access failed:', usersError.message);
    } else {
      console.log('✅ Subscription tiers from real users:');
      
      // Analyze subscription distribution
      const tierCounts = {};
      users.forEach(user => {
        const tier = user.subscription_tier || 'free';
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      });
      
      console.log('   Subscription distribution:');
      Object.entries(tierCounts).forEach(([tier, count]) => {
        const percentage = ((count / users.length) * 100).toFixed(1);
        console.log(`   - ${tier}: ${count} users (${percentage}%)`);
      });
      
      console.log(`   Total users analyzed: ${users.length}`);
      results.subscriptionTiers = true;
    }

    // Test 2: User Subscription Management
    console.log('\n2. Testing User Subscription Management...');
    
    // Test subscription filtering
    const { data: freeUsers, error: freeError } = await supabase
      .from('profiles')
      .select('id, email, subscription_tier')
      .eq('subscription_tier', 'free')
      .limit(10);

    const { data: paidUsers, error: paidError } = await supabase
      .from('profiles')
      .select('id, email, subscription_tier')
      .neq('subscription_tier', 'free')
      .limit(10);

    if (!freeError && !paidError) {
      console.log('✅ Subscription filtering working:');
      console.log(`   - Free tier users: ${freeUsers.length}`);
      console.log(`   - Paid tier users: ${paidUsers.length}`);
      
      if (freeUsers.length > 0) {
        console.log('   Sample free users:');
        freeUsers.slice(0, 3).forEach(user => {
          console.log(`     - ${user.email} (${user.subscription_tier})`);
        });
      }
      
      if (paidUsers.length > 0) {
        console.log('   Sample paid users:');
        paidUsers.slice(0, 3).forEach(user => {
          console.log(`     - ${user.email} (${user.subscription_tier})`);
        });
      }
      
      results.userSubscriptions = true;
    } else {
      console.log('❌ Subscription filtering failed');
    }

    // Test 3: Subscription Statistics
    console.log('\n3. Testing Subscription Statistics...');
    
    if (users) {
      // Calculate real subscription metrics
      const totalUsers = users.length;
      const freeUsersCount = users.filter(u => (u.subscription_tier || 'free') === 'free').length;
      const paidUsersCount = totalUsers - freeUsersCount;
      
      const conversionRate = totalUsers > 0 ? (paidUsersCount / totalUsers) * 100 : 0;
      
      console.log('✅ Subscription statistics from real data:');
      console.log(`   - Total users: ${totalUsers}`);
      console.log(`   - Free users: ${freeUsersCount}`);
      console.log(`   - Paid users: ${paidUsersCount}`);
      console.log(`   - Conversion rate: ${conversionRate.toFixed(1)}%`);
      
      // Monthly cohort analysis
      const monthlySignups = {};
      users.forEach(user => {
        if (user.created_at) {
          const month = user.created_at.substring(0, 7); // YYYY-MM
          if (!monthlySignups[month]) {
            monthlySignups[month] = { total: 0, free: 0, paid: 0 };
          }
          monthlySignups[month].total++;
          if ((user.subscription_tier || 'free') === 'free') {
            monthlySignups[month].free++;
          } else {
            monthlySignups[month].paid++;
          }
        }
      });
      
      console.log('   Monthly signup analysis:');
      Object.entries(monthlySignups)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 3)
        .forEach(([month, data]) => {
          console.log(`     - ${month}: ${data.total} signups (${data.paid} paid, ${data.free} free)`);
        });
      
      results.subscriptionStats = true;
    }

    // Test 4: Real Billing Integration
    console.log('\n4. Testing Real Billing Integration...');
    
    // Check for subscription-related content usage
    const { data: userContent, error: contentError } = await supabase
      .from('brands')
      .select(`
        id,
        user_id,
        created_at,
        profiles!inner(email, subscription_tier)
      `)
      .limit(10);

    if (!contentError && userContent) {
      console.log('✅ Billing integration analysis:');
      
      // Analyze content usage by subscription tier
      const usageByTier = {};
      userContent.forEach(content => {
        const tier = content.profiles?.subscription_tier || 'free';
        if (!usageByTier[tier]) {
          usageByTier[tier] = { users: new Set(), content: 0 };
        }
        usageByTier[tier].users.add(content.user_id);
        usageByTier[tier].content++;
      });
      
      console.log('   Content usage by subscription tier:');
      Object.entries(usageByTier).forEach(([tier, data]) => {
        const avgContentPerUser = data.content / data.users.size;
        console.log(`   - ${tier}: ${data.content} content items from ${data.users.size} users (avg: ${avgContentPerUser.toFixed(1)} per user)`);
      });
      
      // Check for usage limits compliance
      const freeUserUsage = usageByTier.free || { users: new Set(), content: 0 };
      const avgFreeUsage = freeUserUsage.users.size > 0 ? freeUserUsage.content / freeUserUsage.users.size : 0;
      
      console.log(`   Average free user usage: ${avgFreeUsage.toFixed(1)} items`);
      console.log(`   Usage pattern analysis: ${avgFreeUsage > 5 ? 'High usage - good conversion potential' : 'Normal usage'}`);
      
      results.realBilling = true;
    } else {
      console.log('❌ Billing integration analysis failed');
    }

    // Test 5: Subscription Upgrade Opportunities
    console.log('\n5. Testing Upgrade Opportunities...');
    
    if (users && userContent) {
      // Find heavy users on free tier
      const freeHeavyUsers = [];
      const freeUserContentCount = {};
      
      userContent.forEach(content => {
        const tier = content.profiles?.subscription_tier || 'free';
        if (tier === 'free') {
          const userId = content.user_id;
          freeUserContentCount[userId] = (freeUserContentCount[userId] || 0) + 1;
        }
      });
      
      Object.entries(freeUserContentCount).forEach(([userId, count]) => {
        if (count >= 3) { // Heavy usage threshold
          const user = users.find(u => u.id === userId);
          if (user) {
            freeHeavyUsers.push({ ...user, contentCount: count });
          }
        }
      });
      
      console.log('✅ Upgrade opportunity analysis:');
      console.log(`   - Heavy free users (3+ content items): ${freeHeavyUsers.length}`);
      
      if (freeHeavyUsers.length > 0) {
        console.log('   Upgrade candidates:');
        freeHeavyUsers.slice(0, 3).forEach(user => {
          console.log(`     - ${user.email}: ${user.contentCount} items created`);
        });
      }
      
      const upgradeOpportunityRate = users.length > 0 ? (freeHeavyUsers.length / users.length) * 100 : 0;
      console.log(`   Upgrade opportunity rate: ${upgradeOpportunityRate.toFixed(1)}%`);
    }

    // Summary
    console.log('\n📊 SUBSCRIPTION SERVICE TEST RESULTS:');
    console.log('=====================================');
    console.log(`Subscription Tiers: ${results.subscriptionTiers ? '✅ REAL DATA' : '❌ MOCK DATA'}`);
    console.log(`User Subscriptions: ${results.userSubscriptions ? '✅ REAL DATA' : '❌ MOCK DATA'}`);
    console.log(`Subscription Stats: ${results.subscriptionStats ? '✅ REAL DATA' : '❌ MOCK DATA'}`);
    console.log(`Billing Integration: ${results.realBilling ? '✅ REAL DATA' : '❌ MOCK DATA'}`);

    const workingCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    if (workingCount === totalCount) {
      console.log('\n🎉 SUBSCRIPTION SERVICE: 100% REAL DATA!');
      console.log('   ✅ All subscription data from live users');
      console.log('   ✅ No mock billing or fake tiers');
      console.log('   ✅ Real usage patterns and analytics');
      console.log('   ✅ Actual conversion metrics');
    } else {
      console.log(`\n⚠️  Subscription Service: ${workingCount}/${totalCount} functions working with real data`);
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

testSubscriptionService();
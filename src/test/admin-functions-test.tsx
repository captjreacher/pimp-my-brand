import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SimpleAdmin from '../pages/SimpleAdmin';

// Mock the supabase client
const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({
      data: { 
        user: { 
          id: 'test-user-id', 
          email: 'admin@test.com',
          created_at: '2024-01-01T00:00:00Z'
        } 
      },
      error: null
    })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({
          data: {
            id: 'test-user-id',
            email: 'admin@test.com',
            full_name: 'Test Admin',
            app_role: 'super_admin',
            admin_permissions: ['manage_users', 'view_analytics']
          },
          error: null
        })
      })
    })
  })
};

// Mock the supabase import
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock window.location.href
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
});

describe('Admin Functions Integration', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render all admin function cards', async () => {
    renderWithRouter(<SimpleAdmin />);
    
    // Wait for the component to load
    await screen.findByText('Admin Dashboard');
    
    // Check that all admin function cards are present
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Content Moderation')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('AI Content')).toBeInTheDocument();
  });

  it('should have working navigation buttons', async () => {
    renderWithRouter(<SimpleAdmin />);
    
    // Wait for the component to load
    await screen.findByText('Admin Dashboard');
    
    // Test analytics button
    const analyticsButton = screen.getByText('View Analytics');
    fireEvent.click(analyticsButton);
    expect(window.location.href).toBe('/admin/analytics');
    
    // Test moderation button
    const moderationButton = screen.getByText('Moderate Content');
    fireEvent.click(moderationButton);
    expect(window.location.href).toBe('/admin/moderation');
    
    // Test system config button
    const configButton = screen.getByText('System Config');
    fireEvent.click(configButton);
    expect(window.location.href).toBe('/admin/config');
    
    // Test security button
    const securityButton = screen.getByText('Security Settings');
    fireEvent.click(securityButton);
    expect(window.location.href).toBe('/admin/security');
    
    // Test communication button
    const communicationButton = screen.getByText('Communications');
    fireEvent.click(communicationButton);
    expect(window.location.href).toBe('/admin/communication');
    
    // Test subscriptions button
    const subscriptionsButton = screen.getByText('Manage Billing');
    fireEvent.click(subscriptionsButton);
    expect(window.location.href).toBe('/admin/subscriptions');
    
    // Test AI content button
    const aiContentButton = screen.getByText('AI Management');
    fireEvent.click(aiContentButton);
    expect(window.location.href).toBe('/admin/ai-content');
  });

  it('should have working user management buttons', async () => {
    renderWithRouter(<SimpleAdmin />);
    
    // Wait for the component to load
    await screen.findByText('Admin Dashboard');
    
    // Test full user management button
    const fullUserMgmtButton = screen.getByText('Full User Management');
    fireEvent.click(fullUserMgmtButton);
    expect(window.location.href).toBe('/admin/users');
    
    // Test simple user list button
    const simpleUserListButton = screen.getByText('Simple User List');
    fireEvent.click(simpleUserListButton);
    expect(window.location.href).toBe('/working-admin');
  });

  it('should have working full admin system button', async () => {
    renderWithRouter(<SimpleAdmin />);
    
    // Wait for the component to load
    await screen.findByText('Admin Dashboard');
    
    // Test full admin system button
    const fullAdminButton = screen.getByText('Full Admin System');
    fireEvent.click(fullAdminButton);
    expect(window.location.href).toBe('/admin');
  });
});
import React, { useState, useCallback } from 'react';
import { CV, Role, Link } from '@/lib/generators/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Briefcase,
  Award,
  ExternalLink,
  Plus,
  X,
  Edit,
  Save,
  Calendar,
  Building,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';

interface CVEditorProps {
  cv: CV;
  onChange: (cv: CV) => void;
  onSave?: (cv: CV) => Promise<void>;
  className?: string;
  showSaveButton?: boolean;
}

interface EditingRole extends Role {
  id: string;
  isEditing?: boolean;
}

interface EditingLink extends Link {
  id: string;
  isEditing?: boolean;
}

export function CVEditor({ 
  cv, 
  onChange, 
  onSave,
  className = '',
  showSaveButton = true 
}: CVEditorProps) {
  const [editingRoles, setEditingRoles] = useState<EditingRole[]>(
    cv.experience.map((role, index) => ({ ...role, id: `role-${index}` }))
  );
  const [editingLinks, setEditingLinks] = useState<EditingLink[]>(
    cv.links?.map((link, index) => ({ ...link, id: `link-${index}` })) || []
  );
  const [editingSkills, setEditingSkills] = useState<string[]>(cv.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize role form
  const [roleForm, setRoleForm] = useState<Role>({
    role: '',
    org: '',
    dates: '',
    bullets: ['']
  });

  // Initialize link form
  const [linkForm, setLinkForm] = useState<Link>({
    label: '',
    url: ''
  });

  // Update CV when any field changes
  const updateCV = useCallback((updates: Partial<CV>) => {
    const updatedCV = { ...cv, ...updates };
    onChange(updatedCV);
  }, [cv, onChange]);

  // Handle basic field changes
  const handleFieldChange = useCallback((field: keyof CV, value: any) => {
    updateCV({ [field]: value });
  }, [updateCV]);

  // Handle experience changes
  const handleExperienceChange = useCallback(() => {
    const experience = editingRoles.map(({ id, isEditing, ...role }) => role);
    updateCV({ experience });
  }, [editingRoles, updateCV]);

  // Handle links changes
  const handleLinksChange = useCallback(() => {
    const links = editingLinks.map(({ id, isEditing, ...link }) => link);
    updateCV({ links });
  }, [editingLinks, updateCV]);

  // Handle skills changes
  const handleSkillsChange = useCallback((skills: string[]) => {
    setEditingSkills(skills);
    updateCV({ skills });
  }, [updateCV]);

  // Role management
  const openRoleDialog = useCallback((index?: number) => {
    if (index !== undefined) {
      setEditingRoleIndex(index);
      setRoleForm({ ...editingRoles[index] });
    } else {
      setEditingRoleIndex(null);
      setRoleForm({
        role: '',
        org: '',
        dates: '',
        bullets: ['']
      });
    }
    setShowRoleDialog(true);
  }, [editingRoles]);

  const saveRole = useCallback(() => {
    if (!roleForm.role.trim() || !roleForm.org.trim()) {
      toast.error('Role and organization are required');
      return;
    }

    const filteredBullets = roleForm.bullets.filter(bullet => bullet.trim());
    if (filteredBullets.length === 0) {
      toast.error('At least one achievement bullet point is required');
      return;
    }

    const updatedRole = { ...roleForm, bullets: filteredBullets };

    if (editingRoleIndex !== null) {
      // Update existing role
      const newRoles = [...editingRoles];
      newRoles[editingRoleIndex] = { ...updatedRole, id: newRoles[editingRoleIndex].id };
      setEditingRoles(newRoles);
    } else {
      // Add new role
      const newRole = { ...updatedRole, id: `role-${Date.now()}` };
      setEditingRoles([...editingRoles, newRole]);
    }

    setShowRoleDialog(false);
    handleExperienceChange();
  }, [roleForm, editingRoleIndex, editingRoles, handleExperienceChange]);

  const deleteRole = useCallback((index: number) => {
    const newRoles = editingRoles.filter((_, i) => i !== index);
    setEditingRoles(newRoles);
    handleExperienceChange();
  }, [editingRoles, handleExperienceChange]);

  // Link management
  const openLinkDialog = useCallback((index?: number) => {
    if (index !== undefined) {
      setEditingLinkIndex(index);
      setLinkForm({ ...editingLinks[index] });
    } else {
      setEditingLinkIndex(null);
      setLinkForm({ label: '', url: '' });
    }
    setShowLinkDialog(true);
  }, [editingLinks]);

  const saveLink = useCallback(() => {
    if (!linkForm.label.trim() || !linkForm.url.trim()) {
      toast.error('Label and URL are required');
      return;
    }

    // Basic URL validation
    try {
      new URL(linkForm.url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    if (editingLinkIndex !== null) {
      // Update existing link
      const newLinks = [...editingLinks];
      newLinks[editingLinkIndex] = { ...linkForm, id: newLinks[editingLinkIndex].id };
      setEditingLinks(newLinks);
    } else {
      // Add new link
      const newLink = { ...linkForm, id: `link-${Date.now()}` };
      setEditingLinks([...editingLinks, newLink]);
    }

    setShowLinkDialog(false);
    handleLinksChange();
  }, [linkForm, editingLinkIndex, editingLinks, handleLinksChange]);

  const deleteLink = useCallback((index: number) => {
    const newLinks = editingLinks.filter((_, i) => i !== index);
    setEditingLinks(newLinks);
    handleLinksChange();
  }, [editingLinks, handleLinksChange]);

  // Skill management
  const addSkill = useCallback(() => {
    if (newSkill.trim() && !editingSkills.includes(newSkill.trim())) {
      const updatedSkills = [...editingSkills, newSkill.trim()];
      handleSkillsChange(updatedSkills);
      setNewSkill('');
    }
  }, [newSkill, editingSkills, handleSkillsChange]);

  const removeSkill = useCallback((index: number) => {
    const updatedSkills = editingSkills.filter((_, i) => i !== index);
    handleSkillsChange(updatedSkills);
  }, [editingSkills, handleSkillsChange]);

  // Role form helpers
  const updateRoleField = useCallback((field: keyof Role, value: any) => {
    setRoleForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateRoleBullet = useCallback((index: number, value: string) => {
    const newBullets = [...roleForm.bullets];
    newBullets[index] = value;
    setRoleForm(prev => ({ ...prev, bullets: newBullets }));
  }, [roleForm.bullets]);

  const addRoleBullet = useCallback(() => {
    setRoleForm(prev => ({ ...prev, bullets: [...prev.bullets, ''] }));
  }, []);

  const removeRoleBullet = useCallback((index: number) => {
    if (roleForm.bullets.length > 1) {
      const newBullets = roleForm.bullets.filter((_, i) => i !== index);
      setRoleForm(prev => ({ ...prev, bullets: newBullets }));
    }
  }, [roleForm.bullets]);

  // Save CV
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave(cv);
      toast.success('CV saved successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save CV');
    } finally {
      setSaving(false);
    }
  }, [onSave, cv]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={cv.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Professional Title</Label>
              <Input
                id="role"
                value={cv.role || ''}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={cv.summary || ''}
              onChange={(e) => handleFieldChange('summary', e.target.value)}
              placeholder="Brief professional summary highlighting your key strengths and experience"
              className="h-24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Presentation Format</Label>
            <Select
              value={cv.format || 'custom'}
              onValueChange={(value) => handleFieldChange('format', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="ufc">UFC</SelectItem>
                <SelectItem value="team">Team Captain</SelectItem>
                <SelectItem value="military">Military</SelectItem>
                <SelectItem value="nfl">NFL</SelectItem>
                <SelectItem value="influencer">Influencer</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="humanitarian">Humanitarian</SelectItem>
                <SelectItem value="creator">Content Creator</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Professional Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Experience
            </CardTitle>
            <Button onClick={() => openRoleDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {editingRoles.map((role, index) => (
              <div key={role.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{role.role}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{role.org}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{role.dates}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRoleDialog(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRole(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ul className="space-y-1 ml-4">
                  {role.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {editingRoles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No experience added yet. Click "Add Role" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Core Competencies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {editingSkills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {skill}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeSkill(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            />
            <Button onClick={addSkill} disabled={!newSkill.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Professional Links
            </CardTitle>
            <Button onClick={() => openLinkDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {editingLinks.map((link, index) => (
              <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{link.label}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {link.url}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openLinkDialog(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLink(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {editingLinks.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No links added yet. Click "Add Link" to include professional profiles.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {showSaveButton && onSave && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save CV
              </>
            )}
          </Button>
        </div>
      )}

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoleIndex !== null ? 'Edit Role' : 'Add New Role'}
            </DialogTitle>
            <DialogDescription>
              Add details about your professional experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-title">Job Title</Label>
                <Input
                  id="role-title"
                  value={roleForm.role}
                  onChange={(e) => updateRoleField('role', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-org">Organization</Label>
                <Input
                  id="role-org"
                  value={roleForm.org}
                  onChange={(e) => updateRoleField('org', e.target.value)}
                  placeholder="e.g., Tech Company Inc."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-dates">Employment Period</Label>
              <Input
                id="role-dates"
                value={roleForm.dates}
                onChange={(e) => updateRoleField('dates', e.target.value)}
                placeholder="e.g., Jan 2020 - Present"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Key Achievements</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRoleBullet}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Achievement
                </Button>
              </div>
              {roleForm.bullets.map((bullet, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={bullet}
                    onChange={(e) => updateRoleBullet(index, e.target.value)}
                    placeholder="Describe a key achievement or responsibility"
                    className="h-20"
                  />
                  {roleForm.bullets.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoleBullet(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveRole}>
              {editingRoleIndex !== null ? 'Update Role' : 'Add Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLinkIndex !== null ? 'Edit Link' : 'Add Professional Link'}
            </DialogTitle>
            <DialogDescription>
              Add links to your professional profiles and portfolios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-label">Label</Label>
              <Input
                id="link-label"
                value={linkForm.label}
                onChange={(e) => setLinkForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., LinkedIn, GitHub, Portfolio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                value={linkForm.url}
                onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveLink}>
              {editingLinkIndex !== null ? 'Update Link' : 'Add Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
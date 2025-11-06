import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface UserProfile {
  userId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
    soundEnabled?: boolean;
  };
  gameStats?: {
    totalScore: number;
    levelsCompleted: number;
    achievements: string[];
    playTime: number;
    lastLevelPlayed?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    avatar: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // First try to get profile from localStorage (from login)
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        const profileData = JSON.parse(storedProfile);
        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          username: profileData.username || '',
          bio: profileData.bio || '',
          avatar: profileData.avatar || '',
        });
        
        // Sync the game profile with DynamoDB data
        const gameProfile = {
          username: profileData.username || 'BATMAN_01',
          avatarUrl: profileData.avatar,
          totalStars: profileData.gameStats?.totalScore || 0,
          tutorialSeen: true,
          lastSavedAt: new Date().toISOString()
        };
        localStorage.setItem('USER_PROFILE', JSON.stringify(gameProfile));
        
        setLoading(false);
        return;
      }

      // If no stored profile, fetch from API
      const response = await api.get('/profile/me');
      if (response.data.success) {
        setProfile(response.data.data.profile);
        setFormData({
          firstName: response.data.data.profile.firstName || '',
          lastName: response.data.data.profile.lastName || '',
          username: response.data.data.profile.username || '',
          bio: response.data.data.profile.bio || '',
          avatar: response.data.data.profile.avatar || '',
        });
        // Store the fresh profile data
        localStorage.setItem('userProfile', JSON.stringify(response.data.data.profile));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/profile/me', formData);
      if (response.data.success) {
        const updatedProfile = response.data.data.profile;
        setProfile(updatedProfile);
        setEditing(false);
        
        // Update localStorage with the new profile data
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
        // Also update the game profile to keep them in sync
        const gameProfile = {
          username: updatedProfile.username || 'BATMAN_01',
          avatarUrl: updatedProfile.avatar,
          totalStars: updatedProfile.gameStats?.totalScore || 0,
          tutorialSeen: true,
          lastSavedAt: new Date().toISOString()
        };
        localStorage.setItem('USER_PROFILE', JSON.stringify(gameProfile));
        
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '',
      });
    }
    setEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button
          onClick={() => setEditing(!editing)}
          variant={editing ? "outline" : "default"}
        >
          {editing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-lg">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-gray-500">@{profile.username}</p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
              </div>

              <Separator />

              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button onClick={handleCancel} variant="outline">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Bio</Label>
                    <p className="mt-1">{profile.bio || "No bio provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Member Since</Label>
                    <p className="mt-1">{formatDate(profile.createdAt)}</p>
                  </div>
                  {profile.lastLogin && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                      <p className="mt-1">{formatDate(profile.lastLogin)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Game Stats */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Game Statistics</CardTitle>
              <CardDescription>
                Your progress in Gotham Cipher
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {profile.gameStats?.totalScore || 0}
                </div>
                <div className="text-sm text-gray-500">Total Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {profile.gameStats?.levelsCompleted || 0}
                </div>
                <div className="text-sm text-gray-500">Levels Completed</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatPlayTime(profile.gameStats?.playTime || 0)}
                </div>
                <div className="text-sm text-gray-500">Play Time</div>
              </div>

              {profile.gameStats?.achievements && profile.gameStats.achievements.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Achievements</Label>
                  <div className="mt-2 space-y-1">
                    {profile.gameStats.achievements.map((achievement, index) => (
                      <Badge key={index} variant="secondary" className="mr-1">
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

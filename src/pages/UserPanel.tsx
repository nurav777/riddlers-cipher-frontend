import { useState } from 'react';
import { Star, User, Volume2, VolumeX, Settings, RotateCcw, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,  
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/types/game';

interface UserPanelProps {
  userProfile: UserProfile;
  narrationOn: boolean;
  onNarrationToggle: () => void;
  onReplayTutorial: () => void;
  onShowStarsModal: () => void;
  onShowSettings?: () => void;
}

export const UserPanel = ({ 
  userProfile, 
  narrationOn, 
  onNarrationToggle, 
  onReplayTutorial, 
  onShowStarsModal, 
  onShowSettings 
}: UserPanelProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate even if logout fails
      navigate("/");
    }
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);

  return (
    <div className="user-panel fixed top-4 right-4 z-50 animate-fade-in">
      <div className="flex items-center gap-3">
        {/* Narration Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onNarrationToggle}
          className={`batman-glow ${narrationOn ? 'bg-batman text-batman-foreground' : ''}`}
          title={narrationOn ? 'Disable narration' : 'Enable narration'}
        >
          {narrationOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>

        {/* Main User Panel - Enhanced Red Styling */}
        <div className="flex items-center gap-3 pl-3">
          {/* Avatar */}
          <Avatar className="h-10 w-10 border-2 border-primary shadow-lg shadow-primary/25">
            <AvatarImage src={userProfile.avatarUrl} alt={userProfile.username} />
            <AvatarFallback className="bg-secondary font-game text-sm text-primary">
              {userProfile.username.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Username - Clickable */}
          <button
            onClick={() => setShowUserDetails(true)}
            className="hidden md:block text-base font-game font-medium text-primary tracking-wider hover:text-batman transition-colors cursor-pointer"
            title="View profile details"
          >
            {userProfile.username}
          </button>

          {/* Stars Badge - Enhanced with Red Glow */}
          <Badge 
            className="bg-gold text-gold-foreground hover:bg-gold/90 cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg shadow-gold/30"
            onClick={onShowStarsModal}
            title="Stars = progress & rewards. Click to view details."
          >
            <Star className="h-3 w-3 mr-1 gold-star drop-shadow-sm" fill="currentColor" />
            <span className="font-game font-bold">
              {userProfile.totalStars > 99 ? '99+' : userProfile.totalStars}
            </span>
          </Badge>

          {/* Menu Dropdown */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={isMenuOpen ? 'batman-glow' : ''}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="gotham-card border-batman/20">
              <DropdownMenuItem onClick={onReplayTutorial} className="cursor-pointer">
                <RotateCcw className="mr-2 h-4 w-4" />
                Re-play Tutorial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowSettings} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Last Saved Indicator */}
      {userProfile.lastSavedAt && (
        <div className="text-xs text-muted-foreground mt-2 text-right">
          Last saved: {new Date(userProfile.lastSavedAt).toLocaleTimeString()}
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="gotham-card max-w-md border-batman/20">
          <DialogHeader>
            <DialogTitle className="font-game text-2xl text-batman flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.username} />
                <AvatarFallback className="bg-secondary font-game text-base text-primary">
                  {userProfile.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              Profile Details
            </DialogTitle>
            <DialogDescription>
              Your detective progress and achievements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Info */}
            <Card className="border-batman/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-game">Detective Profile</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-base text-muted-foreground">Username:</span>
                    <span className="text-base font-game">{userProfile.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base text-muted-foreground">Total Stars:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 gold-star" fill="currentColor" />
                      <span className="text-base font-game">{userProfile.totalStars}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base text-muted-foreground">Tutorial:</span>
                    <span className="text-base font-game">
                      {userProfile.tutorialSeen ? 'Completed' : 'Not started'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowUserDetails(false);
                  onShowStarsModal();
                }}
                className="flex-1"
              >
                <Star className="h-3 w-3 mr-1" />
                View Stars
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowUserDetails(false);
                  onReplayTutorial();
                }}
                className="flex-1"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Tutorial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
import { useState } from 'react';
import { Volume2, VolumeX, Monitor, Moon, Sun, Palette, RotateCcw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrationOn: boolean;
  onNarrationToggle: () => void;
  onResetProgress?: () => void;
  onSaveSettings?: (settings: GameSettings) => void;
}

interface GameSettings {
  narration: boolean;
  soundEffects: boolean;
  musicVolume: number;
  sfxVolume: number;
  theme: 'light' | 'dark' | 'auto';
  difficulty: 'easy' | 'medium' | 'hard';
  autoSave: boolean;
  showHints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export const SettingsModal = ({ 
  isOpen, 
  onClose, 
  narrationOn, 
  onNarrationToggle,
  onResetProgress,
  onSaveSettings 
}: SettingsModalProps) => {
  const [settings, setSettings] = useState<GameSettings>({
    narration: narrationOn,
    soundEffects: true,
    musicVolume: 70,
    sfxVolume: 80,
    theme: 'auto',
    difficulty: 'medium',
    autoSave: true,
    showHints: true,
    animationSpeed: 'normal'
  });

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSaveSettings?.(settings);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      onResetProgress?.();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gotham-card max-w-2xl border-batman/20">
        <DialogHeader>
          <DialogTitle className="font-game text-3xl text-batman flex items-center gap-2">
            <Palette className="h-7 w-7" />
            Game Settings
          </DialogTitle>
          <DialogDescription>
            Customize your detective experience in Gotham
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audio Settings */}
          <Card className="border-batman/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-game flex items-center gap-2">
                {narrationOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                Audio Settings
              </CardTitle>
              <CardDescription className="text-sm">
                Control narration and sound effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="narration" className="text-base">Narration</Label>
                <Switch
                  id="narration"
                  checked={settings.narration}
                  onCheckedChange={(checked) => {
                    handleSettingChange('narration', checked);
                    onNarrationToggle();
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-effects" className="text-base">Sound Effects</Label>
                <Switch
                  id="sound-effects"
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Music Volume</Label>
                <Slider
                  value={[settings.musicVolume]}
                  onValueChange={(value) => handleSettingChange('musicVolume', value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground text-right">
                  {settings.musicVolume}%
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">SFX Volume</Label>
                <Slider
                  value={[settings.sfxVolume]}
                  onValueChange={(value) => handleSettingChange('sfxVolume', value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground text-right">
                  {settings.sfxVolume}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card className="border-batman/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-game flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Display Settings
              </CardTitle>
              <CardDescription className="text-sm">
                Visual preferences and themes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">Theme</Label>
                <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Auto
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Animation Speed</Label>
                <Select value={settings.animationSpeed} onValueChange={(value) => handleSettingChange('animationSpeed', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-hints" className="text-base">Show Hints</Label>
                <Switch
                  id="show-hints"
                  checked={settings.showHints}
                  onCheckedChange={(checked) => handleSettingChange('showHints', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Game Settings */}
          <Card className="border-batman/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-game">Game Settings</CardTitle>
              <CardDescription className="text-sm">
                Gameplay preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">Default Difficulty</Label>
                <Select value={settings.difficulty} onValueChange={(value) => handleSettingChange('difficulty', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save" className="text-base">Auto Save</Label>
                <Switch
                  id="auto-save"
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="border-batman/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-game">Data Management</CardTitle>
              <CardDescription className="text-sm">
                Manage your game data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="w-full text-destructive hover:text-destructive-foreground hover:bg-destructive"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset All Progress
              </Button>
              
              <div className="text-sm text-muted-foreground text-center">
                This will permanently delete all your progress and stars
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="batman-glow">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

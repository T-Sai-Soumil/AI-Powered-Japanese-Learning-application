import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Monitor, 
  Database,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [resetting, setResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    // Load saved theme or check system preference
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    localStorage.setItem('theme', value);
    applyTheme(value);
  };

  const handleResetHistory = async () => {
    setResetting(true);
    try {
      await fetchApi('/reset_history', { method: 'POST' });
      // Reset successful, could show a toast here
      setIsResetModalOpen(false);
      setResetConfirmText('');
    } catch (error) {
      console.error("Failed to reset history", error);
    } finally {
      setResetting(false);
    }
  };

  const handleFullReset = async () => {
    setResetting(true);
    try {
      await fetchApi('/full_reset', { method: 'POST' });
      // Full reset successful
    } catch (error) {
      console.error("Failed to perform full reset", error);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">Manage your app preferences and data.</p>
      </div>

      <div className="grid gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="mr-2 h-5 w-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Customize how the Lang Portal looks on your device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">Theme Preference</h4>
                <p className="text-sm text-muted-foreground">Select light, dark, or follow system setting.</p>
              </div>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="light">
                    <div className="flex items-center"><Sun className="mr-2 h-4 w-4" /> Light</div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center"><Moon className="mr-2 h-4 w-4" /> Dark</div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center"><Monitor className="mr-2 h-4 w-4" /> System</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <Database className="mr-2 h-5 w-5" /> Data Management
            </CardTitle>
            <CardDescription>Be careful, these actions cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">Reset Study History</h4>
                <p className="text-sm text-muted-foreground">Deletes all past study sessions and word review stats.</p>
              </div>
              
              <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground whitespace-nowrap">
                    <Trash2 className="mr-2 h-4 w-4" /> Reset History
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Reset Study History</DialogTitle>
                    <DialogDescription>
                      Are you absolutely sure? This action cannot be undone. Type <strong>reset me</strong> to confirm.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <input 
                      type="text" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Type 'reset me'"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                    />
                  </div>
                  <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => { setIsResetModalOpen(false); setResetConfirmText(''); }} className="mt-2 sm:mt-0">Cancel</Button>
                    <Button variant="destructive" onClick={handleResetHistory} disabled={resetting || resetConfirmText !== 'reset me'}>
                      {resetting ? "Resetting..." : "Yes, reset history"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/50">
              <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">Full Database Reset</h4>
                <p className="text-sm text-muted-foreground">Drops all tables and re-seeds with default data.</p>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="whitespace-nowrap">
                    <AlertTriangle className="mr-2 h-4 w-4" /> Full Reset
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Full Database Reset</DialogTitle>
                    <DialogDescription>
                      This will completely wipe your database, including all vocabulary and history, and restore the default seed data. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-6">
                    <Button variant="outline" className="mt-2 sm:mt-0">Cancel</Button>
                    <Button variant="destructive" onClick={handleFullReset} disabled={resetting}>
                      {resetting ? "Resetting..." : "Yes, perform full reset"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Trophy, Target, BookOpen, Activity } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface LastSession {
  id: number;
  group_id: number;
  created_at: string;
  study_activity_id: number;
  group_name: string;
}

interface StudyProgress {
  total_words_studied: number;
  total_available_words: number;
}

interface QuickStats {
  success_rate: number;
  total_study_sessions: number;
  total_active_groups: number;
  study_streak_days: number;
}

export default function Dashboard() {
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [sessionData, progressData, statsData] = await Promise.all([
          fetchApi<LastSession>('/dashboard/last_study_session').catch(() => null),
          fetchApi<StudyProgress>('/dashboard/study_progress').catch(() => null),
          fetchApi<QuickStats>('/dashboard/quick_stats').catch(() => null)
        ]);
        
        setLastSession(sessionData);
        setProgress(progressData);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const progressPercentage = progress && progress.total_available_words > 0 
    ? (progress.total_words_studied / progress.total_available_words) * 100 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's a summary of your learning progress.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20 transition-all hover:scale-105">
          <Link to="/study-activities">
            Start Studying <Activity className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Last Study Session */}
        <Card className="glass-card flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-primary">
              <Clock className="mr-2 h-5 w-5" />
              Last Study Session
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <div className="h-20 animate-pulse bg-muted rounded-md" />
            ) : lastSession ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Activity</p>
                  <p className="font-medium text-lg">{lastSession.group_name} Vocabulary</p>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {new Date(lastSession.created_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-4">
                <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                <p>No recent sessions</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t border-border/50">
             <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link to={`/study-sessions/${lastSession?.id || ''}`}>View Details</Link>
             </Button>
          </CardFooter>
        </Card>

        {/* Study Progress */}
        <Card className="glass-card flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-primary">
              <Target className="mr-2 h-5 w-5" />
              Study Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="h-20 animate-pulse bg-muted rounded-md" />
            ) : progress ? (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-bold">{progress.total_words_studied}</p>
                    <p className="text-sm text-muted-foreground">Words Studied</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-medium text-muted-foreground">/ {progress.total_available_words}</p>
                    <p className="text-sm text-muted-foreground">Total Words</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Mastery Progress</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2 bg-primary/20" />
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No progress data</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="glass-card md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-primary">
              <Trophy className="mr-2 h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 animate-pulse bg-muted rounded-md" />
            ) : stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <div className="flex items-center text-green-500 mb-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium uppercase tracking-wider">Success</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.success_rate}%</p>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <div className="flex items-center text-orange-500 mb-1">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium uppercase tracking-wider">Streak</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.study_streak_days} <span className="text-sm font-normal text-muted-foreground">days</span></p>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Sessions</p>
                  <p className="text-xl font-bold">{stats.total_study_sessions}</p>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Groups</p>
                  <p className="text-xl font-bold">{stats.total_active_groups}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No stats available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

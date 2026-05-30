import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { fetchApi } from '@/lib/api';
import { Play, Eye, BookOpen } from 'lucide-react';

interface StudyActivity {
  id: number;
  name: string;
  thumbnail_url: string;
  description: string;
}

interface Group {
  id: number;
  group_name: string;
}

export default function StudyActivities() {
  const [activities, setActivities] = useState<StudyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [launchingActivity, setLaunchingActivity] = useState<StudyActivity | null>(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await fetchApi<StudyActivity[]>('/study_activities');
        setActivities(data);
      } catch (error) {
        console.error("Failed to load study activities", error);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

  const fetchGroups = async () => {
    if (groups.length > 0) return;
    try {
      const data = await fetchApi<{items: Group[]}>('/groups');
      setGroups(data.items || []);
    } catch (error) {
      console.error("Failed to load groups", error);
    }
  };

  const handleLaunch = () => {
    if (!selectedGroup) return;
    window.open(`http://localhost:8081?group_id=${selectedGroup}`, '_blank');
    setLaunchingActivity(null); // Close modal
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <BookOpen className="mr-3 h-8 w-8 text-primary" />
          Study Activities
        </h1>
        <p className="text-muted-foreground mt-2">Choose an activity to start practicing your Japanese.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card overflow-hidden">
              <div className="h-48 bg-muted animate-pulse" />
              <CardHeader><div className="h-6 bg-muted animate-pulse rounded w-1/2" /></CardHeader>
              <CardFooter><div className="h-10 bg-muted animate-pulse rounded w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="glass-card overflow-hidden flex flex-col group">
              <div className="relative h-48 bg-muted overflow-hidden">
                {activity.thumbnail_url ? (
                  <img 
                    src={activity.thumbnail_url} 
                    alt={activity.name} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" 
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground/50">
                    <BookOpen className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <CardHeader className="flex-1">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{activity.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{activity.description}</p>
              </CardHeader>
              <CardFooter className="gap-3 pt-4 border-t border-border/50">
                <Dialog open={launchingActivity?.id === activity.id} onOpenChange={(open) => {
                  if (open) {
                    setLaunchingActivity(activity);
                    fetchGroups();
                  } else {
                    setLaunchingActivity(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 shadow-md shadow-primary/20">
                      <Play className="mr-2 h-4 w-4" /> Launch
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Launch {activity.name}</DialogTitle>
                      <DialogDescription>
                        Select a word group to practice with this activity.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a group..." />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id.toString()}>{g.group_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLaunchingActivity(null)}>Cancel</Button>
                      <Button onClick={handleLaunch} disabled={!selectedGroup}>
                        <Play className="mr-2 h-4 w-4" /> Launch Activity
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" className="flex-1" asChild>
                  <Link to={`/study-activities/${activity.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No Activities Found</h3>
          <p className="text-muted-foreground mt-1">There are no study activities available at the moment.</p>
        </div>
      )}
    </div>
  );
}

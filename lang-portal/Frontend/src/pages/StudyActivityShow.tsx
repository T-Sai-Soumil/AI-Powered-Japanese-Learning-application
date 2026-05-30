import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchApi } from '@/lib/api';
import { Play, ArrowLeft, Clock } from 'lucide-react';

interface StudyActivity {
  id: number;
  name: string;
  thumbnail_url: string;
  description: string;
}

interface StudySession {
  id: number;
  activity_name: string;
  group_id: number;
  group_name: string;
  start_time: string;
  end_time: string;
  review_items_count: number;
}

interface Group {
  id: number;
  group_name: string;
}

export default function StudyActivityShow() {
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<StudyActivity | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activityData, sessionsData] = await Promise.all([
          fetchApi<StudyActivity>(`/study_activities/${id}`),
          fetchApi<{items: StudySession[]}>(`/study_activities/${id}/study_sessions`)
        ]);
        setActivity(activityData);
        setSessions(sessionsData.items || []);
      } catch (error) {
        console.error("Failed to load activity details", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

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
    setIsLaunchModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strTime = hours + ':' + minutes + ' ' + ampm;
    return `${yyyy}-${mm}-${dd} ${strTime}`;
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-10 w-32 bg-muted rounded" />
      <div className="h-64 bg-muted rounded-xl" />
    </div>;
  }

  if (!activity) {
    return <div>Activity not found</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <Link to="/study-activities">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Activities
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="glass-card overflow-hidden border-primary/20">
            <div className="h-48 bg-muted">
              {activity.thumbnail_url ? (
                <img src={activity.thumbnail_url} alt={activity.name} className="object-cover w-full h-full" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-muted-foreground">No Thumbnail</div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">{activity.name}</CardTitle>
              <CardDescription className="text-base mt-2">{activity.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isLaunchModalOpen} onOpenChange={(open) => {
                setIsLaunchModalOpen(open);
                if (open) fetchGroups();
              }}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full shadow-lg shadow-primary/20">
                    <Play className="mr-2 h-5 w-5" /> Launch Activity
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
                    <Button variant="outline" onClick={() => setIsLaunchModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleLaunch} disabled={!selectedGroup}>
                      <Play className="mr-2 h-4 w-4" /> Launch Activity
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Clock className="mr-2 h-6 w-6 text-primary" /> Past Sessions
          </h2>
          <Card className="glass-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-right"># Review Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length > 0 ? sessions.map((session) => (
                  <TableRow key={session.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.location.href = `/sessions/${session.id}`}>
                    <TableCell>
                      <Link to={`/word-groups/${session.group_id}`} className="hover:underline text-primary" onClick={(e) => e.stopPropagation()}>
                        {session.group_name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(session.start_time)}</TableCell>
                    <TableCell>{formatDate(session.end_time)}</TableCell>
                    <TableCell className="text-right">{session.review_items_count}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No past sessions for this activity.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}

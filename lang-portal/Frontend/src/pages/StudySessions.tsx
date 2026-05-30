import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { Clock, ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';

interface StudySession {
  id: number;
  activity_name: string;
  group_id: number;
  group_name: string;
  start_time: string;
  end_time: string;
  review_items_count: number;
}

type SortKey = 'id' | 'activity_name' | 'group_name' | 'start_time' | 'end_time' | 'review_items_count';
type SortDirection = 'asc' | 'desc';

export default function StudySessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('start_time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const data = await fetchApi<{ items: StudySession[], total_pages: number }>(`/study_sessions?page=${page}&sort_by=${sortBy}&order=${sortDirection}`);
        setSessions(data.items || []);
        setTotalPages(data.total_pages || 1);
      } catch (error) {
        console.error("Failed to load study sessions", error);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, [page, sortBy, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
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

  const SortableHead = ({ label, sortKey, alignRight }: { label: string, sortKey: SortKey, alignRight?: boolean }) => (
    <TableHead className={alignRight ? "text-right cursor-pointer hover:bg-muted/80 select-none transition-colors" : "cursor-pointer hover:bg-muted/80 select-none transition-colors"} onClick={() => handleSort(sortKey)}>
      <div className={`flex items-center ${alignRight ? "justify-end" : ""}`}>
        {label}
        {sortBy === sortKey && (
          sortDirection === 'asc' ? <ArrowDown className="ml-1 h-4 w-4" /> : <ArrowUp className="ml-1 h-4 w-4" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Clock className="mr-3 h-8 w-8 text-primary" />
            Study Sessions
          </h1>
          <p className="text-muted-foreground mt-2">Review your past study activity history.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <SortableHead label="ID" sortKey="id" />
                <SortableHead label="Activity" sortKey="activity_name" />
                <SortableHead label="Group" sortKey="group_name" />
                <SortableHead label="Start Time" sortKey="start_time" />
                <SortableHead label="End Time" sortKey="end_time" />
                <SortableHead label="Items Review" sortKey="review_items_count" alignRight />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-8 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <TableRow 
                    key={session.id} 
                    className="cursor-pointer hover:bg-primary/5 transition-colors group"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <TableCell className="font-bold text-muted-foreground group-hover:text-primary">
                      #{session.id}
                    </TableCell>
                    <TableCell className="font-medium">{session.activity_name}</TableCell>
                    <TableCell>
                      <Link to={`/word-groups/${session.group_id}`} className="hover:underline text-primary" onClick={(e) => e.stopPropagation()}>
                        {session.group_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(session.start_time)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(session.end_time)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {session.review_items_count}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                    No study sessions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between px-4 py-4 border-t border-border/50 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Page <span className="font-bold text-foreground">{page}</span> of {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

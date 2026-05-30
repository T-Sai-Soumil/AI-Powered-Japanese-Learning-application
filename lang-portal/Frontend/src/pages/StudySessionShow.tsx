import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { Clock, ArrowLeft, ChevronLeft, ChevronRight, Activity, Layers, Calendar, Target } from 'lucide-react';

interface StudySession {
  id: number;
  activity_name: string;
  group_name: string;
  start_time: string;
  end_time: string;
  review_items_count: number;
}

interface Word {
  id: number;
  japanese: string;
  romaji: string;
  english: string;
  correct_count: number;
  wrong_count: number;
}

export default function StudySessionShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<StudySession | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await fetchApi<StudySession>(`/study_sessions/${id}`);
        setSession(data);
      } catch (error) {
        console.error("Failed to load session details", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadSession();
  }, [id]);

  useEffect(() => {
    const loadWords = async () => {
      setWordsLoading(true);
      try {
        const data = await fetchApi<{items: Word[], total_pages: number}>(`/study_sessions/${id}/words?page=${page}`);
        setWords(data.items || []);
        setTotalPages(data.total_pages || 1);
      } catch (error) {
        console.error("Failed to load session words", error);
      } finally {
        setWordsLoading(false);
      }
    };
    if (id) loadWords();
  }, [id, page]);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-40 bg-muted rounded-xl" />
      <div className="h-64 bg-muted rounded-xl" />
    </div>;
  }

  if (!session) return <div>Session not found</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <Link to="/study-sessions">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sessions
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card md:col-span-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center text-primary">
                  <Clock className="mr-3 h-8 w-8" /> Session #{session.id}
                </h1>
                <p className="text-muted-foreground mt-2 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(session.start_time).toLocaleString()} - {new Date(session.end_time).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="bg-background/50 backdrop-blur rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center">
                    <Activity className="mr-1 h-3 w-3" /> Activity
                  </p>
                  <p className="font-semibold">{session.activity_name}</p>
                </div>
                <div className="bg-background/50 backdrop-blur rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center">
                    <Layers className="mr-1 h-3 w-3" /> Group
                  </p>
                  <p className="font-semibold text-primary">{session.group_name}</p>
                </div>
                <div className="bg-background/50 backdrop-blur rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center">
                    <Target className="mr-1 h-3 w-3" /> Items
                  </p>
                  <p className="font-semibold">{session.review_items_count}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center">
          <Target className="mr-2 h-6 w-6 text-primary" /> Words Reviewed
        </h2>
        <div className="glass-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Japanese</TableHead>
                  <TableHead>Romaji</TableHead>
                  <TableHead>English</TableHead>
                  <TableHead className="text-right">Correct</TableHead>
                  <TableHead className="text-right">Wrong</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wordsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                      <TableCell><div className="h-5 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : words.length > 0 ? (
                  words.map((word) => (
                    <TableRow key={word.id} className="cursor-pointer hover:bg-primary/5 group" onClick={() => navigate(`/words/${word.id}`)}>
                      <TableCell className="font-bold text-lg text-primary group-hover:underline">{word.japanese}</TableCell>
                      <TableCell className="text-muted-foreground">{word.romaji}</TableCell>
                      <TableCell className="font-medium">{word.english}</TableCell>
                      <TableCell className="text-right text-green-500 font-medium">{word.correct_count}</TableCell>
                      <TableCell className="text-right text-destructive font-medium">{word.wrong_count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No words reviewed in this session.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-t border-border/50 bg-muted/20">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || wordsLoading}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || wordsLoading}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

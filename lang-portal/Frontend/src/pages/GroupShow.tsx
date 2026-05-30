import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { Layers, ArrowLeft, ChevronLeft, ChevronRight, BookOpen, ArrowDown, ArrowUp, Volume2 } from 'lucide-react';

interface GroupDetails {
  id: number;
  group_name: string;
  total_word_count: number;
}

interface Word {
  id: number;
  japanese: string;
  romaji: string;
  english: string;
  correct_count: number;
  wrong_count: number;
}

type SortKey = 'japanese' | 'romaji' | 'english' | 'correct_count' | 'wrong_count';
type SortDirection = 'asc' | 'desc';

export default function GroupShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  
  const [words, setWords] = useState<Word[]>([]);
  const [wordsPage, setWordsPage] = useState(1);
  const [wordsTotalPages, setWordsTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>('japanese');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const data = await fetchApi<GroupDetails>(`/groups/${id}`);
        setGroup(data);
      } catch (error) {
        console.error("Failed to load group details", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadGroup();
  }, [id]);

  useEffect(() => {
    const loadWords = async () => {
      try {
        const data = await fetchApi<{items: Word[], total_pages: number}>(`/groups/${id}/words?page=${wordsPage}&sort_by=${sortBy}&order=${sortDirection}`);
        setWords(data.items || []);
        setWordsTotalPages(data.total_pages || 1);
      } catch (error) {
        console.error("Failed to load group words", error);
      }
    };
    if (id) loadWords();
  }, [id, wordsPage, sortBy, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const playAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
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

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  if (!group) return <div>Group not found</div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <Link to="/word-groups">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Word Groups
          </Link>
        </Button>
      </div>

      <div className="glass-card rounded-xl p-8 border border-primary/20 bg-gradient-to-br from-card to-card/50">
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center mb-4">
          <Layers className="mr-3 h-8 w-8" />
          {group.group_name}
        </h1>
        <div className="flex space-x-8 text-muted-foreground">
          <div className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            <span className="text-lg">Total Words: <strong className="text-foreground">{group.total_word_count}</strong></span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center">
          <BookOpen className="mr-2 h-6 w-6 text-primary" /> Words in Group
        </h2>
        <div className="glass-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <SortableHead label="Japanese" sortKey="japanese" />
                  <SortableHead label="Romaji" sortKey="romaji" />
                  <SortableHead label="English" sortKey="english" />
                  <SortableHead label="Correct" sortKey="correct_count" alignRight />
                  <SortableHead label="Wrong" sortKey="wrong_count" alignRight />
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.length > 0 ? words.map((word) => (
                  <TableRow key={word.id} className="cursor-pointer hover:bg-primary/5 transition-colors group" onClick={() => navigate(`/words/${word.id}`)}>
                    <TableCell className="font-bold text-lg text-primary">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:underline">{word.japanese}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-primary rounded-full" 
                          onClick={(e) => playAudio(e, word.japanese)}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{word.romaji}</TableCell>
                    <TableCell className="font-medium">{word.english}</TableCell>
                    <TableCell className="text-right text-green-500 font-medium">{word.correct_count}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">{word.wrong_count}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No words found in this group.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-t border-border/50 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-bold text-foreground">{wordsPage}</span> of {wordsTotalPages}
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setWordsPage(p => Math.max(1, p - 1))} disabled={wordsPage === 1} className="h-8">
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWordsPage(p => Math.min(wordsTotalPages, p + 1))} disabled={wordsPage === wordsTotalPages} className="h-8">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

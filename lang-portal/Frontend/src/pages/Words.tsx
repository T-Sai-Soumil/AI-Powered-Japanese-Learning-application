import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { Library, ChevronLeft, ChevronRight, Volume2, ArrowDown, ArrowUp } from 'lucide-react';

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

export default function Words() {
  const navigate = useNavigate();
  const [words, setWords] = useState<Word[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('japanese');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const loadWords = async () => {
      setLoading(true);
      try {
        const data = await fetchApi<{ items: Word[], total_pages: number }>(`/words?page=${page}&sort_by=${sortBy}&order=${sortDirection}`);
        setWords(data.items || []);
        setTotalPages(data.total_pages || 1);
      } catch (error) {
        console.error("Failed to load words", error);
      } finally {
        setLoading(false);
      }
    };
    loadWords();
  }, [page, sortBy, sortDirection]);

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

  const SortableHead = ({ label, sortKey, alignRight }: { label: string, sortKey: SortKey, alignRight?: boolean }) => {
    return (
      <TableHead className={alignRight ? "text-right cursor-pointer hover:bg-muted/80 select-none transition-colors" : "cursor-pointer hover:bg-muted/80 select-none transition-colors"} onClick={() => handleSort(sortKey)}>
        <div className={`flex items-center ${alignRight ? "justify-end" : ""}`}>
          {label}
          {sortBy === sortKey && (
            sortDirection === 'asc' ? <ArrowDown className="ml-1 h-4 w-4" /> : <ArrowUp className="ml-1 h-4 w-4" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Library className="mr-3 h-8 w-8 text-primary" />
            Vocabulary
          </h1>
          <p className="text-muted-foreground mt-2">Browse and manage all Japanese words in your database.</p>
        </div>
      </div>

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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
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
                  <TableRow 
                    key={word.id} 
                    className="cursor-pointer hover:bg-primary/5 transition-colors group"
                    onClick={() => navigate(`/words/${word.id}`)}
                  >
                    <TableCell className="font-bold text-lg text-primary">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:underline">{word.japanese}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-primary rounded-full" 
                          onClick={(e) => playAudio(e, word.japanese)}
                          title="Play pronunciation"
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                    No words found.
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

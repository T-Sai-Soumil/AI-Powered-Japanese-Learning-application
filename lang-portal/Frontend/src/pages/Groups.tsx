import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { Layers, ChevronLeft, ChevronRight, BookOpen, ArrowDown, ArrowUp } from 'lucide-react';

interface Group {
  id: number;
  group_name: string;
  word_count: number;
}

type SortKey = 'group_name' | 'word_count';
type SortDirection = 'asc' | 'desc';

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('group_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      try {
        const data = await fetchApi<{ items: Group[], total_pages: number }>(`/groups?page=${page}&sort_by=${sortBy}&order=${sortDirection}`);
        setGroups(data.items || []);
        setTotalPages(data.total_pages || 1);
      } catch (error) {
        console.error("Failed to load groups", error);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, [page, sortBy, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Layers className="mr-3 h-8 w-8 text-primary" />
            Word Groups
          </h1>
          <p className="text-muted-foreground mt-2">Manage collections of words to study together.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <SortableHead label="Group Name" sortKey="group_name" />
                <SortableHead label="Word Count" sortKey="word_count" alignRight />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-48 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow 
                    key={group.id} 
                    className="cursor-pointer hover:bg-primary/5 transition-colors group"
                    onClick={() => navigate(`/word-groups/${group.id}`)}
                  >
                    <TableCell className="font-bold text-lg text-primary group-hover:underline">
                      {group.group_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center bg-muted/50 px-2.5 py-0.5 rounded-full text-sm font-medium">
                        <BookOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {group.word_count}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-32 text-muted-foreground">
                    No groups found.
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

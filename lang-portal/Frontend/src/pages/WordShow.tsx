import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { ArrowLeft, CheckCircle2, XCircle, Tag } from 'lucide-react';

interface WordGroup {
  id: number;
  name: string;
}

interface Word {
  id: number;
  japanese: string;
  romaji: string;
  english: string;
  correct_count: number;
  wrong_count: number;
  groups: WordGroup[];
}

export default function WordShow() {
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWord = async () => {
      try {
        const data = await fetchApi<Word>(`/words/${id}`);
        setWord(data);
      } catch (error) {
        console.error("Failed to load word details", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadWord();
  }, [id]);

  if (loading) {
    return <div className="animate-pulse space-y-8 max-w-2xl mx-auto">
      <div className="h-10 w-32 bg-muted rounded" />
      <div className="h-64 bg-muted rounded-xl" />
    </div>;
  }

  if (!word) {
    return <div className="text-center py-12">Word not found</div>;
  }

  const totalReviews = word.correct_count + word.wrong_count;
  const accuracy = totalReviews > 0 ? Math.round((word.correct_count / totalReviews) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <Link to="/words">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vocabulary
          </Link>
        </Button>
      </div>

      <Card className="glass-card shadow-xl overflow-hidden border-primary/20">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <span className="text-9xl font-bold">{word.japanese}</span>
        </div>
        
        <CardHeader className="text-center pb-8 pt-12 border-b border-border/50">
          <h1 className="text-7xl font-bold text-primary mb-4 tracking-tight">{word.japanese}</h1>
          <div className="flex flex-col items-center justify-center space-y-2">
            <span className="text-2xl font-medium text-foreground">{word.romaji}</span>
            <span className="text-xl text-muted-foreground italic">{word.english}</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-8">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center border-b border-border/50 pb-2">
                <Tag className="mr-2 h-5 w-5 text-primary" /> Word Groups
              </h3>
              <div className="flex flex-wrap gap-2">
                {word.groups && word.groups.length > 0 ? (
                  word.groups.map(group => (
                    <Link key={group.id} to={`/groups/${group.id}`}>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
                        {group.name}
                      </span>
                    </Link>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm italic">Not assigned to any groups</span>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center border-b border-border/50 pb-2">
                Study Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-500">{word.correct_count}</p>
                  <p className="text-xs uppercase tracking-wider font-medium text-green-600/70 dark:text-green-400/70">Correct</p>
                </div>
                
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                  <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold text-destructive">{word.wrong_count}</p>
                  <p className="text-xs uppercase tracking-wider font-medium text-destructive/70">Wrong</p>
                </div>
              </div>
              
              {totalReviews > 0 && (
                <div className="mt-4 bg-muted/50 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Accuracy</span>
                  <span className={`text-lg font-bold ${accuracy > 70 ? 'text-green-500' : accuracy < 40 ? 'text-destructive' : 'text-orange-500'}`}>
                    {accuracy}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

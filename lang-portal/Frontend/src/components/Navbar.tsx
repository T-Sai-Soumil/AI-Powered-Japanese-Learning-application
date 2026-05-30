import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BookOpen, Activity, Library, Layers, Clock, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Activity },
  { name: 'Study Activities', path: '/study-activities', icon: BookOpen },
  { name: 'Words', path: '/words', icon: Library },
  { name: 'Word Groups', path: '/word-groups', icon: Layers },
  { name: 'Sessions', path: '/sessions', icon: Clock },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center mx-auto px-4">
        <div className="mr-8 flex items-center space-x-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            LangPortal
          </span>
        </div>
        <div className="flex flex-1 items-center space-x-1 sm:space-x-2 overflow-x-auto pb-2 sm:pb-0 mt-2 sm:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline-block">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

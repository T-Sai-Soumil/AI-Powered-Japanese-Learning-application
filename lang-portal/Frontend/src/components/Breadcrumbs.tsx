import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(p => p);

  if (paths.length === 0 || paths[0] === 'dashboard') return null;

  const getBreadcrumbName = (path: string) => {
    switch (path) {
      case 'study-activities': return 'Study Activities';
      case 'words': return 'Words';
      case 'word-groups': return 'Word Groups';
      case 'sessions': return 'Sessions';
      case 'settings': return 'Settings';
      default: return path; // For IDs
    }
  };

  return (
    <div className="bg-muted/30 border-b border-border/50">
      <div className="container mx-auto px-4 py-2 flex items-center text-sm text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground flex items-center transition-colors">
          <Home className="h-3.5 w-3.5" />
        </Link>
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const to = `/${paths.slice(0, index + 1).join('/')}`;
          const name = getBreadcrumbName(path);
          
          return (
            <div key={path} className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 mx-1 opacity-50" />
              {isLast ? (
                <span className="font-medium text-foreground">{name}</span>
              ) : (
                <Link to={to} className="hover:text-foreground transition-colors">
                  {name}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import Dashboard from '@/pages/Dashboard';
import StudyActivities from '@/pages/StudyActivities';
import StudyActivityShow from '@/pages/StudyActivityShow';
import Words from '@/pages/Words';
import WordShow from '@/pages/WordShow';
import Groups from '@/pages/Groups';
import GroupShow from '@/pages/GroupShow';
import StudySessions from '@/pages/StudySessions';
import StudySessionShow from '@/pages/StudySessionShow';
import Settings from '@/pages/Settings';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <Breadcrumbs />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/study-activities" element={<StudyActivities />} />
            <Route path="/study-activities/:id" element={<StudyActivityShow />} />
            <Route path="/words" element={<Words />} />
            <Route path="/words/:id" element={<WordShow />} />
            <Route path="/word-groups" element={<Groups />} />
            <Route path="/word-groups/:id" element={<GroupShow />} />
            <Route path="/sessions" element={<StudySessions />} />
            <Route path="/sessions/:id" element={<StudySessionShow />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { PublicLayout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/States';
import { useI18n } from './context/I18nContext';
import { useSetting } from './context/SettingsContext';
import Home from './pages/Home';
import ListPage from './pages/ListPage';
import MaterialDetail from './pages/MaterialDetail';
import AnimationView from './pages/AnimationView';
import TestView from './pages/TestView';
import GradePage from './pages/GradePage';
import TopicPage from './pages/TopicPage';
import About from './pages/About';
import NotFound from './pages/NotFound';

// Admin paneli alohida yuklanadi — o'quvchilar uchun sayt tezroq ochiladi
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Login = lazy(() => import('./admin/Login'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const MaterialsAdmin = lazy(() => import('./admin/MaterialsAdmin'));
const MaterialForm = lazy(() => import('./admin/MaterialForm'));
const TopicsAdmin = lazy(() => import('./admin/TopicsAdmin'));
const AnimationsAdmin = lazy(() => import('./admin/AnimationsAdmin'));
const AnimationEditor = lazy(() => import('./admin/AnimationEditor'));
const TestsAdmin = lazy(() => import('./admin/TestsAdmin'));
const TestEditor = lazy(() => import('./admin/TestEditor'));
const SettingsAdmin = lazy(() => import('./admin/SettingsAdmin'));

function TitleSync() {
  const { t } = useI18n();
  const setting = useSetting();
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${setting('siteName', t('subject'))} · 5–6`;
  }, [pathname, setting, t]);
  return null;
}

export default function App() {
  return (
    <>
      <TitleSync />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="lesson-plans" element={<ListPage key="lesson_plan" sectionKey="lesson_plan" />} />
            <Route path="videos" element={<ListPage key="video" sectionKey="video" />} />
            <Route path="slides" element={<ListPage key="slide" sectionKey="slide" />} />
            <Route path="handouts" element={<ListPage key="handout" sectionKey="handout" />} />
            <Route path="library" element={<ListPage key="library" sectionKey="library" />} />
            <Route path="animations" element={<ListPage key="animation" sectionKey="animation" />} />
            <Route path="animations/:id" element={<AnimationView />} />
            <Route path="tests" element={<ListPage key="test" sectionKey="test" />} />
            <Route path="tests/:id" element={<TestView />} />
            <Route path="material/:id" element={<MaterialDetail />} />
            <Route path="grade/:grade" element={<GradePage />} />
            <Route path="topic/:id" element={<TopicPage />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="admin/login" element={<Login />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="materials/:type" element={<MaterialsAdmin />} />
            <Route path="materials/:type/new" element={<MaterialForm key="new" />} />
            <Route path="materials/:type/:id" element={<MaterialForm />} />
            <Route path="topics" element={<TopicsAdmin />} />
            <Route path="animations" element={<AnimationsAdmin />} />
            <Route path="animations/new" element={<AnimationEditor key="new" />} />
            <Route path="animations/:id" element={<AnimationEditor />} />
            <Route path="tests" element={<TestsAdmin />} />
            <Route path="tests/new" element={<TestEditor key="new" />} />
            <Route path="tests/:id" element={<TestEditor />} />
            <Route path="settings" element={<SettingsAdmin />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

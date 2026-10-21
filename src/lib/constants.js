import { BookOpen, PlayCircle, Presentation, FileText, Library, Sparkles, ClipboardCheck } from 'lucide-react';

export const GRADES = [5, 6];

/**
 * Fayl asosidagi material turlari. Har biri ommaviy sahifa va admin bo'limiga ega.
 * `path` — ommaviy URL, `accept` — fayl tanlash oynasidagi formatlar.
 */
export const MATERIAL_TYPES = {
  lesson_plan: {
    key: 'lesson_plan',
    path: '/lesson-plans',
    icon: BookOpen,
    color: 'blue',
    accept: '.pdf,.doc,.docx,.odt,.rtf,.txt,.ppt,.pptx',
    categories: [],
  },
  video: {
    key: 'video',
    path: '/videos',
    icon: PlayCircle,
    color: 'red',
    accept: 'video/*,.mp4,.webm,.mov,.m4v',
    categories: [],
  },
  slide: {
    key: 'slide',
    path: '/slides',
    icon: Presentation,
    color: 'orange',
    accept: '.pdf,.ppt,.pptx,.odp,.key,image/*',
    categories: [],
  },
  handout: {
    key: 'handout',
    path: '/handouts',
    icon: FileText,
    color: 'green',
    accept: '.pdf,.doc,.docx,.odt,.xls,.xlsx,.ppt,.pptx,.txt,image/*',
    categories: ['handout', 'worksheet', 'assignment'],
  },
  library: {
    key: 'library',
    path: '/library',
    icon: Library,
    color: 'purple',
    accept: '.pdf,.epub,.djvu,.doc,.docx,.odt,.ppt,.pptx,image/*',
    categories: ['textbook', 'methodical', 'book', 'other'],
  },
};

export const SECTIONS = [
  { key: 'lesson_plan', path: '/lesson-plans', icon: BookOpen, color: 'blue', table: 'materials' },
  { key: 'video', path: '/videos', icon: PlayCircle, color: 'red', table: 'materials' },
  { key: 'slide', path: '/slides', icon: Presentation, color: 'orange', table: 'materials' },
  { key: 'handout', path: '/handouts', icon: FileText, color: 'green', table: 'materials' },
  { key: 'library', path: '/library', icon: Library, color: 'purple', table: 'materials' },
  { key: 'animation', path: '/animations', icon: Sparkles, color: 'teal', table: 'animations' },
  { key: 'test', path: '/tests', icon: ClipboardCheck, color: 'indigo', table: 'tests' },
];

import { User } from './types';
import type { Assignment } from './components/ClassroomCard';

export const USERS: User[] = [
  {
    id: 'aba',
    name: 'Aba',
    age: 27,
    persona: 'The Architect',
    theme: 'gold',
    themeHex: '#d9a84e',
    avatarInitials: 'AB',
    role: 'admin',
    aiAssistantRole: 'Strategic Advisor',
    learningFocus: 'Enterprise Architecture, AI Consultancy',
  },
  {
    id: 'badu',
    name: 'Badu',
    age: 52,
    persona: 'The Master',
    theme: 'emerald',
    themeHex: '#10b981',
    avatarInitials: 'BD',
    role: 'learner',
    aiAssistantRole: 'Patient Companion',
    learningFocus: 'Cooking recipes, health management',
  },
  {
    id: 'kobby',
    name: 'Kobby',
    age: 11,
    persona: 'The Analyst',
    theme: 'cyan',
    themeHex: '#22d3ee',
    avatarInitials: 'KB',
    role: 'learner',
    aiAssistantRole: 'Tech Mentor',
    learningFocus: 'Dashboards, coding basics',
  },
  {
    id: 'pappy',
    name: 'Pappy',
    age: 8,
    persona: 'The Explorer',
    theme: 'amber',
    themeHex: '#f59e0b',
    avatarInitials: 'PP',
    role: 'learner',
    aiAssistantRole: 'Storyteller',
    learningFocus: 'Basic math, science, reading',
  },
  {
    id: 'kweku',
    name: 'Kweku',
    age: 5,
    persona: 'The Discoverer',
    theme: 'purple',
    themeHex: '#a855f7',
    avatarInitials: 'KW',
    role: 'learner',
    aiAssistantRole: 'Playmate',
    learningFocus: 'Phonics, numbers, shapes',
  },
  {
    id: 'shee',
    name: 'Shee',
    age: 3,
    persona: 'The Seedling',
    theme: 'lime',
    themeHex: '#a3c520',
    avatarInitials: 'SH',
    role: 'learner',
    aiAssistantRole: 'Nurturer',
    learningFocus: 'Nursery rhymes, colors, animals',
  },
  {
    id: 'seth',
    name: 'Seth',
    age: 6,
    persona: 'The Adventurer',
    theme: 'sky',
    themeHex: '#0ea5e9',
    avatarInitials: 'SE',
    role: 'learner',
    aiAssistantRole: 'Adventure Guide',
    learningFocus: 'Early reading, counting, nature, simple games',
  },
];

/** Mock courses & assignments for Learning Hub (until Classroom API is live) */
export function getMockAssignments(userId: string): Assignment[] {
  const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
  const map: Record<string, Assignment[]> = {
    aba: [
      {
        id: 'cw_aba_1',
        title: 'Enterprise Architecture Canvas',
        description: 'Map current-state services and integration risks.',
        dueDate: inDays(5),
        status: 'PENDING',
        points: 100,
      },
      {
        id: 'cw_aba_2',
        title: 'BABOK Requirements Review',
        description: 'Summarize the requirements lifecycle.',
        dueDate: inDays(8),
        status: 'SUBMITTED',
        points: 80,
      },
      {
        id: 'cw_aba_3',
        title: 'AI Consultancy Brief',
        description: 'Draft a one-page engagement proposal.',
        dueDate: inDays(12),
        status: 'PENDING',
        points: 120,
      },
    ],
    badu: [
      {
        id: 'cw_badu_1',
        title: 'Lasagna Layering Practice',
        description: 'Complete steps 4–7 of the recipe card.',
        dueDate: inDays(2),
        status: 'PENDING',
        points: 50,
      },
      {
        id: 'cw_badu_2',
        title: 'Weekly Meal Plan',
        description: 'Plan five healthy dinners.',
        dueDate: inDays(4),
        status: 'PENDING',
        points: 40,
      },
    ],
    kobby: [
      {
        id: 'cw_kobby_1',
        title: 'Python Variables & Types',
        description: 'Master the basics of data storage.',
        dueDate: inDays(0),
        status: 'GRADED',
        points: 150,
      },
      {
        id: 'cw_kobby_2',
        title: 'Loops & Logic Challenge',
        description: 'Write a program to sort a list of numbers.',
        dueDate: inDays(1),
        status: 'PENDING',
        points: 300,
      },
      {
        id: 'cw_kobby_3',
        title: 'Mini Dashboard Sketch',
        description: 'Draw a simple chart layout on paper or screen.',
        dueDate: inDays(6),
        status: 'PENDING',
        points: 200,
      },
    ],
    pappy: [
      {
        id: 'cw_pappy_1',
        title: 'Planet Name Quest',
        description: 'Name the planets in order from the sun.',
        dueDate: inDays(3),
        status: 'PENDING',
        points: 40,
      },
      {
        id: 'cw_pappy_2',
        title: 'Reading Adventure',
        description: 'Read one short story out loud.',
        dueDate: inDays(2),
        status: 'PENDING',
        points: 35,
      },
    ],
    seth: [
      {
        id: 'cw_seth_1',
        title: 'Letter Hunt: S',
        description: 'Find five things that start with S.',
        dueDate: inDays(2),
        status: 'PENDING',
        points: 30,
      },
      {
        id: 'cw_seth_2',
        title: 'Count the Trail',
        description: 'Count objects on a nature walk (1–20).',
        dueDate: inDays(3),
        status: 'PENDING',
        points: 25,
      },
    ],
    kweku: [
      {
        id: 'cw_kweku_1',
        title: 'Shape Song',
        description: 'Tap circle, square, and star.',
        dueDate: inDays(1),
        status: 'PENDING',
        points: 20,
      },
      {
        id: 'cw_kweku_2',
        title: 'Color Match',
        description: 'Match red, blue, and yellow.',
        dueDate: inDays(2),
        status: 'PENDING',
        points: 20,
      },
    ],
    shee: [
      {
        id: 'cw_shee_1',
        title: 'Animal Sounds',
        description: 'Make the cow and dog sounds.',
        dueDate: inDays(1),
        status: 'PENDING',
        points: 10,
      },
    ],
  };
  return map[userId] || [];
}

export function getMockCourses(userId: string) {
  const byUser: Record<string, { id: string; title: string; emoji: string; progress: number }[]> = {
    aba: [
      { id: 'c1', title: 'Enterprise Architecture', emoji: '🏛️', progress: 62 },
      { id: 'c2', title: 'AI Consultancy Studio', emoji: '🤖', progress: 40 },
      { id: 'c3', title: 'BABOK Essentials', emoji: '📘', progress: 55 },
    ],
    badu: [
      { id: 'c1', title: 'Kitchen Mastery', emoji: '🍲', progress: 48 },
      { id: 'c2', title: 'Healthy Living', emoji: '💚', progress: 35 },
    ],
    kobby: [
      { id: 'c1', title: 'Python Quest', emoji: '🐍', progress: 70 },
      { id: 'c2', title: 'Data Dashboards', emoji: '📊', progress: 45 },
      { id: 'c3', title: 'Logic Games', emoji: '🧩', progress: 80 },
    ],
    pappy: [
      { id: 'c1', title: 'Space Explorers', emoji: '🚀', progress: 50 },
      { id: 'c2', title: 'Reading Trails', emoji: '📖', progress: 40 },
    ],
    seth: [
      { id: 'c1', title: 'Nature Adventures', emoji: '🌲', progress: 35 },
      { id: 'c2', title: 'Letter Hunters', emoji: '🔤', progress: 55 },
    ],
    kweku: [
      { id: 'c1', title: 'Shapes & Colors', emoji: '🎨', progress: 60 },
      { id: 'c2', title: 'Phonics Play', emoji: '🔊', progress: 30 },
    ],
    shee: [
      { id: 'c1', title: 'Nursery Garden', emoji: '🌸', progress: 25 },
      { id: 'c2', title: 'Animal Friends', emoji: '🐾', progress: 40 },
    ],
  };
  return byUser[userId] || [{ id: 'c0', title: 'Family Learning', emoji: '📚', progress: 20 }];
}

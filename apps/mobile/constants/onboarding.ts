/**
 * Onboarding slide content
 */

export const ONBOARDING_SLIDES = [
  {
    id: 'welcome',
    title: 'Welcome to StatCheck',
    description: 'Your personal sports player ranking companion. Build lists, compare stats, and settle debates.',
    icon: 'trophy-outline' as const,
    gradient: ['#7C3AED', '#5B21B6'], // Purple
  },
  {
    id: 'search',
    title: 'Find Any Player',
    description: 'Search across NBA, NFL, MLB, and NHL. Get instant access to stats, career highlights, and more.',
    icon: 'search-outline' as const,
    gradient: ['#3B82F6', '#1D4ED8'], // Blue
  },
  {
    id: 'lists',
    title: 'Create Your Rankings',
    description: 'Build custom lists, drag to rank players, and share your takes with friends.',
    icon: 'list-outline' as const,
    gradient: ['#10B981', '#047857'], // Green
  },
] as const;

export type OnboardingSlide = typeof ONBOARDING_SLIDES[number];

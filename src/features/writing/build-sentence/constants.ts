export interface Avatar {
  id: string;
  url: string;
  gender: 'male' | 'female';
  name?: string;
}

export const AVATARS: Avatar[] = [
  // Local generated avatars
  { id: 'male_1', url: '/avatars/male_1.png', gender: 'male' },
  { id: 'male_2', url: '/avatars/male_2.png', gender: 'male' },
  { id: 'male_3', url: '/avatars/male_3.png', gender: 'male' },
  { id: 'male_4', url: '/avatars/male_4.png', gender: 'male' },
  { id: 'male_5', url: '/avatars/male_5.png', gender: 'male' },
  { id: 'female_1', url: '/avatars/female_1.png', gender: 'female' },
  { id: 'female_2', url: '/avatars/female_2.png', gender: 'female' },
  { id: 'female_3', url: '/avatars/female_3.png', gender: 'female' },
  { id: 'female_4', url: '/avatars/female_4.png', gender: 'female' },
  { id: 'female_5', url: '/avatars/female_5.png', gender: 'female' },
];


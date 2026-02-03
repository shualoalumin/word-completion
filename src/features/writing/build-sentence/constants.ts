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
  
  // High quality Unsplash placeholders for additional diversity (especially more females)
  { 
    id: 'female_2', 
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', 
    gender: 'female' 
  },
  { 
    id: 'female_3', 
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', 
    gender: 'female' 
  },
  { 
    id: 'female_4', 
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop', 
    gender: 'female' 
  },
  { 
    id: 'female_5', 
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop', 
    gender: 'female' 
  },
];

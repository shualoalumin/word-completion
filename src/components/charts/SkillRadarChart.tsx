/**
 * Skill Radar Chart Component
 * 3개 스킬 (vocabulary, grammar, inference) 레이더 차트
 */

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface SkillData {
  skill: string;
  value: number; // 0-100
  fullMark: number;
}

interface SkillRadarChartProps {
  data: SkillData[];
  darkMode?: boolean;
  className?: string;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  data,
  darkMode = true,
  className,
}) => {
  // Ensure we have all 3 skills
  const defaultSkills: SkillData[] = [
    { skill: 'Vocabulary', value: 0, fullMark: 100 },
    { skill: 'Grammar', value: 0, fullMark: 100 },
    { skill: 'Inference', value: 0, fullMark: 100 },
  ];

  const chartData = defaultSkills.map((defaultSkill) => {
    const found = data.find((d) => d.skill.toLowerCase() === defaultSkill.skill.toLowerCase());
    return found || defaultSkill;
  });

  return (
    <div className={cn('w-full h-64', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke={darkMode ? '#3f3f46' : '#e4e4e7'} />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: darkMode ? '#a1a1aa' : '#52525b', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: darkMode ? '#71717a' : '#a1a1aa', fontSize: 10 }}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke={darkMode ? '#3b82f6' : '#2563eb'}
            fill={darkMode ? '#3b82f6' : '#3b82f6'}
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

import { FormatOverlay, PresentationFormat } from './types';

export const formatOverlays: Record<PresentationFormat, FormatOverlay> = {
  ufc: {
    id: 'ufc',
    name: 'UFC Announcer',
    description: 'High-energy, punchy, ring-side style',
    systemPrompt: `Transform the content using UFC announcer style:
- Use high-energy, punchy language
- Include fight terminology and metaphors
- Emphasize power, dominance, and victory
- Use short, impactful phrases
- Add intensity and excitement
- Reference combat sports concepts
- Keep the core facts accurate while making the tone explosive`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to high-energy, combat sports announcer style'
      },
      {
        target: 'language',
        transformation: 'Use fight terminology, power words, and victory metaphors'
      },
      {
        target: 'structure',
        transformation: 'Break into short, punchy statements with maximum impact'
      }
    ],
    examples: [
      {
        before: 'Experienced project manager with strong leadership skills',
        after: 'CHAMPIONSHIP-LEVEL project domination with KNOCKOUT leadership power'
      },
      {
        before: 'Increased team productivity by 25%',
        after: 'DELIVERED a 25% CRUSHING VICTORY in team performance'
      }
    ]
  },

  military: {
    id: 'military',
    name: 'Military',
    description: 'Brevity, precision, professional',
    systemPrompt: `Transform the content using military precision style:
- Use concise, direct language
- Employ military terminology and structure
- Emphasize discipline, precision, and mission focus
- Use action-oriented verbs
- Maintain professional brevity
- Reference military concepts like operations, missions, objectives
- Keep facts accurate while adding military precision`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to precise, disciplined military communication'
      },
      {
        target: 'language',
        transformation: 'Use military terminology, operational language, and mission-focused vocabulary'
      },
      {
        target: 'structure',
        transformation: 'Organize in clear, hierarchical, mission-brief format'
      }
    ],
    examples: [
      {
        before: 'Led a team of 15 developers on multiple projects',
        after: 'COMMANDED 15-person development unit across multiple operational objectives'
      },
      {
        before: 'Successfully completed project ahead of schedule',
        after: 'MISSION ACCOMPLISHED: Objective secured ahead of timeline'
      }
    ]
  },

  team: {
    id: 'team',
    name: 'Team Captain',
    description: 'TV roster card, leadership tone',
    systemPrompt: `Transform the content using team captain/TV roster style:
- Use sports team roster language
- Emphasize leadership and team dynamics
- Include position/role terminology
- Reference team achievements and stats
- Use broadcast commentary style
- Highlight captain qualities and team contributions
- Maintain accuracy while adding sports team energy`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to team captain leadership and sports roster style'
      },
      {
        target: 'language',
        transformation: 'Use team sports terminology, leadership language, and roster card format'
      },
      {
        target: 'structure',
        transformation: 'Format like TV sports roster with stats and achievements'
      }
    ],
    examples: [
      {
        before: 'Senior Software Engineer with 8 years experience',
        after: 'TEAM CAPTAIN • Senior Software Engineer • 8 seasons of elite performance'
      },
      {
        before: 'Mentored junior developers',
        after: 'DEVELOPED rookie talent • Built championship-caliber team depth'
      }
    ]
  },

  solo: {
    id: 'solo',
    name: 'Solo Athlete',
    description: 'Individual stats, commentator style',
    systemPrompt: `Transform the content using solo athlete/individual sports style:
- Use individual sports commentary language
- Emphasize personal achievements and records
- Include performance metrics and stats
- Reference individual competition and excellence
- Use sports commentator analysis style
- Highlight personal bests and achievements
- Keep facts accurate while adding athletic performance focus`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to individual athlete performance and sports commentary style'
      },
      {
        target: 'language',
        transformation: 'Use individual sports terminology, performance metrics, and achievement language'
      },
      {
        target: 'structure',
        transformation: 'Format like athlete profile with stats and personal records'
      }
    ],
    examples: [
      {
        before: 'Consistently exceeded sales targets',
        after: 'PERSONAL BEST: Consistently shattered performance benchmarks'
      },
      {
        before: 'Improved process efficiency by 30%',
        after: 'RECORD-BREAKING 30% efficiency improvement • Solo performance excellence'
      }
    ]
  },

  nfl: {
    id: 'nfl',
    name: 'NFL Star',
    description: 'Playbook metaphors, broadcast gloss',
    systemPrompt: `Transform the content using NFL broadcast style:
- Use American football terminology and metaphors
- Include playbook and strategy language
- Reference NFL broadcast commentary style
- Emphasize game-changing plays and victories
- Use football positions and formations as metaphors
- Add broadcast excitement and analysis
- Maintain accuracy while adding NFL broadcast energy`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to NFL broadcast commentary and football analysis style'
      },
      {
        target: 'language',
        transformation: 'Use NFL terminology, playbook metaphors, and broadcast language'
      },
      {
        target: 'structure',
        transformation: 'Format like NFL player profile with game highlights and stats'
      }
    ],
    examples: [
      {
        before: 'Strategic planning and execution',
        after: 'GAME-CHANGING playbook execution • Strategic field general'
      },
      {
        before: 'Led successful product launch',
        after: 'TOUCHDOWN! Orchestrated championship-level product launch'
      }
    ]
  },

  influencer: {
    id: 'influencer',
    name: 'Influencer',
    description: 'Social proof, celebrity tone',
    systemPrompt: `Transform the content using influencer/celebrity style:
- Use social media and celebrity language
- Emphasize influence, reach, and social proof
- Include collaboration and brand partnership terminology
- Reference follower engagement and viral content
- Use trendy, aspirational language
- Highlight personal brand and influence
- Keep facts accurate while adding social media star appeal`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to influencer celebrity and social media star style'
      },
      {
        target: 'language',
        transformation: 'Use social media terminology, influence language, and celebrity appeal'
      },
      {
        target: 'structure',
        transformation: 'Format like influencer bio with social proof and brand partnerships'
      }
    ],
    examples: [
      {
        before: 'Built strong professional network',
        after: '✨ VIRAL networking success • Built empire of industry connections'
      },
      {
        before: 'Successful marketing campaigns',
        after: 'TRENDING marketing campaigns • Brand collaboration royalty'
      }
    ]
  },

  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'Corporate leadership, C-suite authority',
    systemPrompt: `Transform the content using executive/C-suite style:
- Use corporate leadership language
- Emphasize strategic vision and business impact
- Include executive terminology and boardroom language
- Reference P&L responsibility and stakeholder management
- Use authoritative, results-driven tone
- Highlight business transformation and growth
- Maintain accuracy while adding executive gravitas`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to executive leadership and C-suite authority style'
      },
      {
        target: 'language',
        transformation: 'Use corporate executive terminology, strategic language, and business impact focus'
      },
      {
        target: 'structure',
        transformation: 'Format like executive profile with strategic achievements and business results'
      }
    ],
    examples: [
      {
        before: 'Managed budget of $2M annually',
        after: 'STRATEGIC P&L stewardship • $2M annual fiscal responsibility'
      },
      {
        before: 'Improved team performance',
        after: 'TRANSFORMED organizational capability • Delivered measurable performance excellence'
      }
    ]
  },

  artist: {
    id: 'artist',
    name: 'Artist / Musician',
    description: 'Creative portfolio, press kit style',
    systemPrompt: `Transform the content using artist/musician press kit style:
- Use creative industry and artistic language
- Emphasize artistic vision and creative achievements
- Include music/art industry terminology
- Reference albums, exhibitions, performances, and creative works
- Use press kit and media coverage style
- Highlight artistic impact and creative recognition
- Keep facts accurate while adding artistic flair`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to artistic creative and press kit style'
      },
      {
        target: 'language',
        transformation: 'Use creative industry terminology, artistic language, and press coverage style'
      },
      {
        target: 'structure',
        transformation: 'Format like artist press kit with creative achievements and artistic impact'
      }
    ],
    examples: [
      {
        before: 'Led creative projects',
        after: 'VISIONARY creative direction • Orchestrated groundbreaking artistic collaborations'
      },
      {
        before: 'Received industry recognition',
        after: 'CRITICALLY ACCLAIMED • Industry recognition for artistic excellence'
      }
    ]
  },

  humanitarian: {
    id: 'humanitarian',
    name: 'Humanitarian',
    description: 'Mission-driven, impact-focused',
    systemPrompt: `Transform the content using humanitarian/mission-driven style:
- Use mission-focused and impact-driven language
- Emphasize social change and community benefit
- Include humanitarian and nonprofit terminology
- Reference global impact and social justice
- Use purpose-driven, inspirational tone
- Highlight meaningful change and community service
- Maintain accuracy while adding humanitarian purpose`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to humanitarian mission-driven and social impact style'
      },
      {
        target: 'language',
        transformation: 'Use humanitarian terminology, impact language, and mission-focused vocabulary'
      },
      {
        target: 'structure',
        transformation: 'Format like humanitarian profile with social impact and mission achievements'
      }
    ],
    examples: [
      {
        before: 'Managed community outreach programs',
        after: 'CHAMPIONED transformative community impact • Mobilized grassroots change initiatives'
      },
      {
        before: 'Increased program participation by 40%',
        after: 'EMPOWERED 40% more lives through expanded program reach'
      }
    ]
  },

  creator: {
    id: 'creator',
    name: 'Content Creator',
    description: 'Platform stats, brand partnerships',
    systemPrompt: `Transform the content using content creator/digital creator style:
- Use digital platform and content creation language
- Emphasize audience engagement and content performance
- Include creator economy and platform terminology
- Reference views, subscribers, and viral content
- Use creator community and brand partnership language
- Highlight content impact and audience building
- Keep facts accurate while adding creator economy appeal`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to content creator and digital platform style'
      },
      {
        target: 'language',
        transformation: 'Use creator economy terminology, platform language, and audience engagement focus'
      },
      {
        target: 'structure',
        transformation: 'Format like creator profile with platform stats and content achievements'
      }
    ],
    examples: [
      {
        before: 'Built engaged community',
        after: 'VIRAL community building • Cultivated highly-engaged creator ecosystem'
      },
      {
        before: 'Successful content strategy',
        after: 'TRENDING content mastery • Algorithm-beating creative strategy'
      }
    ]
  },

  fashion: {
    id: 'fashion',
    name: 'Fashion / Model',
    description: 'Lookbook style, editorial tone',
    systemPrompt: `Transform the content using fashion/modeling editorial style:
- Use fashion industry and editorial language
- Emphasize style, aesthetics, and visual impact
- Include runway, editorial, and fashion terminology
- Reference campaigns, shoots, and fashion achievements
- Use sophisticated, style-focused tone
- Highlight fashion influence and aesthetic vision
- Maintain accuracy while adding fashion editorial elegance`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Convert to fashion editorial and modeling industry style'
      },
      {
        target: 'language',
        transformation: 'Use fashion terminology, editorial language, and style-focused vocabulary'
      },
      {
        target: 'structure',
        transformation: 'Format like fashion profile with editorial achievements and style influence'
      }
    ],
    examples: [
      {
        before: 'Strong attention to detail',
        after: 'EDITORIAL precision • Couture-level attention to aesthetic perfection'
      },
      {
        before: 'Led visual design projects',
        after: 'RUNWAY-READY visual direction • Orchestrated high-fashion creative campaigns'
      }
    ]
  },

  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Adaptable professional style',
    systemPrompt: `Transform the content using custom user-defined style:
- Use the provided keywords and tone preferences
- Adapt language to match the specified style
- Maintain professional quality while incorporating custom elements
- Apply user-defined tone and terminology
- Keep the core message and facts accurate
- Blend professional presentation with custom style preferences`,
    styleModifiers: [
      {
        target: 'tone',
        transformation: 'Apply user-defined tone and style preferences'
      },
      {
        target: 'language',
        transformation: 'Incorporate custom keywords and terminology'
      },
      {
        target: 'structure',
        transformation: 'Adapt structure to match custom style requirements'
      }
    ],
    examples: [
      {
        before: 'Experienced professional',
        after: '[Adapts based on user-defined keywords and tone]'
      },
      {
        before: 'Successful project completion',
        after: '[Transforms using custom style preferences]'
      }
    ]
  }
};

export function getFormatOverlay(format: PresentationFormat): FormatOverlay {
  return formatOverlays[format];
}

export function getAllFormats(): FormatOverlay[] {
  return Object.values(formatOverlays);
}
import type React from 'react'

// 1. Buttons
import { GlassButton } from '@/components/ui/buttons/GlassButton'
import { GradientButton } from '@/components/ui/buttons/GradientButton'
import { NeonButton } from '@/components/ui/buttons/NeonButton'
import { ShimmerButton } from '@/components/ui/buttons/ShimmerButton'
import { IsometricButton } from '@/components/ui/button/IsometricButton'

// 2. Effects & Cards
import { LiquidGlass } from '@/components/effects/LiquidGlass'
import { Magnet } from '@/components/effects/Magnet'
import { GlowingCards, GlowingCard } from '@/components/lightswind/glowing-cards'

// 3. Typography & Text
import { AnimatedText } from '@/components/ui/AnimatedText'
import { GlowText } from '@/components/ui/text/GlowText'
import { GradientText } from '@/components/ui/text/GradientText'
import { ShimmerText } from '@/components/ui/text/ShimmerText'

// 4. Icons
import { Icon } from '@/components/ui/icons/Icon'

// 5. Previews
import {
  SpringSelectPreview,
  SpringSliderPreview,
  SpringAccordionPreview,
  PasswordFieldPreview,
  FloatingFieldPreview,
  GlassFieldPreview,
} from './previews'

export type ComponentCategory =
  | 'all'
  | 'buttons'
  | 'fields'
  | 'effects'
  | 'springs'
  | 'typography'

export interface ComponentItem {
  id: string
  name: string
  category: Exclude<ComponentCategory, 'all'>
  categoryLabel: string
  description: string
  tamilDescription: string
  badge?: string
  tags: string[]
  renderPreview: () => React.ReactNode
  codeSnippet: string
}

/* -------------------------------------------------------------------------
   COMPONENT REGISTRY LIST
   To add any future component, simply add an entry below!
------------------------------------------------------------------------- */
export const COMPONENT_REGISTRY: ComponentItem[] = [
  // 1. IsometricButton
  {
    id: 'isometric-button',
    name: 'IsometricButton',
    category: 'buttons',
    categoryLabel: 'Buttons',
    badge: 'DesignPass',
    description: '3D Isometric prism button built with pure CSS transforms and dynamic spring curves.',
    tamilDescription: '3D முப்பரிமாண கண்ணாடிக் கட்டை பட்டன். அமுக்கும் போது நிஜமான 3D ஆழத்துடன் அழுந்தும்.',
    tags: ['button', '3d', 'isometric', 'css3d', 'spring'],
    renderPreview: () => (
      <div className="h-16 flex items-center justify-center">
        <IsometricButton
          wrapperClassName="w-44 h-11"
          settings={{
            glowColor: '#a855f7',
            textColor: '#ffffff',
            fontSize: '0.9rem',
          }}
          onClick={() => alert('Isometric button clicked!')}
        >
          Launch Action
        </IsometricButton>
      </div>
    ),
    codeSnippet: `import { IsometricButton } from '@/components/ui/button/IsometricButton'

<IsometricButton
  wrapperClassName="w-44 h-11"
  settings={{ glowColor: '#a855f7', textColor: '#ffffff' }}
  onClick={() => console.log('Clicked')}
>
  Launch Action
</IsometricButton>`,
  },

  // 2. GlassButton
  {
    id: 'glass-button',
    name: 'GlassButton',
    category: 'buttons',
    categoryLabel: 'Buttons',
    badge: 'Core UI',
    description: 'Frosted glassmorphism button with primary, secondary, and ghost text variants.',
    tamilDescription: 'மெல்லிய கண்ணாடி போன்ற பின்னணியுடன் கூடிய முதன்மை மற்றும் இரண்டாம் நிலை பட்டன்.',
    tags: ['button', 'glass', 'frosted', 'primary', 'secondary'],
    renderPreview: () => (
      <div className="flex flex-wrap items-center gap-3">
        <GlassButton variant="primary">Primary</GlassButton>
        <GlassButton variant="secondary">Secondary</GlassButton>
        <GlassButton variant="text">Ghost Link</GlassButton>
      </div>
    ),
    codeSnippet: `import { GlassButton } from '@/components/ui/buttons/GlassButton'

<GlassButton variant="primary">Primary</GlassButton>
<GlassButton variant="secondary">Secondary</GlassButton>
<GlassButton variant="text">Ghost</GlassButton>`,
  },

  // 3. NeonButton
  {
    id: 'neon-button',
    name: 'NeonButton',
    category: 'buttons',
    categoryLabel: 'Buttons',
    badge: 'Core UI',
    description: 'Vibrant neon cyber button with customizable edge glow and inner glow shadow.',
    tamilDescription: 'பிரகாசமான நியான் விளிம்புகளுடன் கூடிய ஒளிரும் பட்டன்.',
    tags: ['button', 'neon', 'glow', 'cyber'],
    renderPreview: () => (
      <div className="flex flex-wrap items-center gap-3">
        <NeonButton glowColor="#a855f7">Purple Neon</NeonButton>
        <NeonButton glowColor="#06b6d4">Cyan Neon</NeonButton>
      </div>
    ),
    codeSnippet: `import { NeonButton } from '@/components/ui/buttons/NeonButton'

<NeonButton glowColor="#a855f7">Purple Neon</NeonButton>
<NeonButton glowColor="#06b6d4">Cyan Neon</NeonButton>`,
  },

  // 4. GradientButton
  {
    id: 'gradient-button',
    name: 'GradientButton',
    category: 'buttons',
    categoryLabel: 'Buttons',
    badge: 'Core UI',
    description: 'Smooth linear gradient button tailored for high-converting call-to-actions.',
    tamilDescription: 'வண்ணமயமான சாய்வு (Gradient) வண்ணங்களுடன் கூடிய கண்ணாடிக் கவர்ச்சி பட்டன்.',
    tags: ['button', 'gradient', 'cta'],
    renderPreview: () => (
      <GradientButton>Get Started Now</GradientButton>
    ),
    codeSnippet: `import { GradientButton } from '@/components/ui/buttons/GradientButton'

<GradientButton>Get Started Now</GradientButton>`,
  },

  // 5. ShimmerButton
  {
    id: 'shimmer-button',
    name: 'ShimmerButton',
    category: 'buttons',
    categoryLabel: 'Buttons',
    badge: 'Core UI',
    description: 'Button featuring an animated sweeping light shimmer across the glossy surface.',
    tamilDescription: 'ஒளிக்கதிர் நகர்ந்து மின்னும் (Shimmer light) ஆடம்பர பட்டன்.',
    tags: ['button', 'shimmer', 'animation'],
    renderPreview: () => (
      <ShimmerButton>Shimmering CTA</ShimmerButton>
    ),
    codeSnippet: `import { ShimmerButton } from '@/components/ui/buttons/ShimmerButton'

<ShimmerButton>Shimmering CTA</ShimmerButton>`,
  },

  // 6. LiquidGlass
  {
    id: 'liquid-glass',
    name: 'LiquidGlass',
    category: 'effects',
    categoryLabel: 'Effects & Cards',
    badge: 'DesignPass',
    description: 'Physical optical refraction panel with Snell’s law lens deflection and jelly elasticity.',
    tamilDescription: 'ஆப்பிள் பாணி ஒளிரும் திரவக் கண்ணாடி. அமுக்கும் போது ஜெல்லி போல வளையும்.',
    tags: ['glass', 'refraction', 'liquid', 'physics', 'elastic'],
    renderPreview: () => (
      <LiquidGlass
        radius={20}
        bezel={12}
        depth={36}
        refraction={1.35}
        magnify={1.1}
        elastic={true}
        magnet={true}
        className="p-5 max-w-sm border border-white/10"
      >
        <div className="font-semibold text-white text-sm">Optical Refraction Glass</div>
        <div className="text-xs text-white/70 mt-1">
          Hover to tilt, press to experience elastic jelly displacement!
        </div>
      </LiquidGlass>
    ),
    codeSnippet: `import { LiquidGlass } from '@/components/effects/LiquidGlass'

<LiquidGlass
  radius={20}
  bezel={12}
  depth={36}
  refraction={1.35}
  elastic={true}
  magnet={true}
  className="p-5"
>
  <h3>Optical Refraction</h3>
</LiquidGlass>`,
  },

  // 7. Magnet
  {
    id: 'magnet',
    name: 'Magnet',
    category: 'effects',
    categoryLabel: 'Effects & Cards',
    badge: 'DesignPass',
    description: 'Spring magnetic attraction with 3D cursor tilt physics and specular lens glare.',
    tamilDescription: 'மவுஸ் கர்சரைக் கவரும் காந்த விசை மற்றும் 3D பளபளப்புக் கண்ணாடி விளைவு.',
    tags: ['magnet', 'physics', 'tilt', 'glare'],
    renderPreview: () => (
      <Magnet radius={2} pullFactor={0.35} tiltStrength={12} glare={true} wrapperClassName="inline-block">
        <div className="px-5 py-3 rounded-2xl bg-white/[0.05] border border-white/15 text-xs text-white/90">
          Hover to feel magnetic attraction &amp; 3D glare
        </div>
      </Magnet>
    ),
    codeSnippet: `import { Magnet } from '@/components/effects/Magnet'

<Magnet radius={2} pullFactor={0.35} tiltStrength={12} glare={true}>
  <div className="p-4 bg-white/5 rounded-2xl">Hover me</div>
</Magnet>`,
  },

  // 8. GlowingCards
  {
    id: 'glowing-cards',
    name: 'GlowingCards',
    category: 'effects',
    categoryLabel: 'Effects & Cards',
    badge: 'Lightswind',
    description: 'Multi-card container featuring cursor-proximity radial boundary glow illumination.',
    tamilDescription: 'மவுஸ் நகரும் போது அட்டைகளின் விளிம்பில் ஒளிரும் வண்ணப் பாதை.',
    tags: ['cards', 'glow', 'border', 'proximity'],
    renderPreview: () => (
      <GlowingCards maxWidth="100%" gap="0.75rem" glowRadius={6}>
        <GlowingCard className="p-4 flex-1">
          <div className="text-xs font-semibold text-purple-300">Glass Metric</div>
          <div className="text-xl font-bold text-white mt-1">99.8%</div>
        </GlowingCard>
        <GlowingCard className="p-4 flex-1">
          <div className="text-xs font-semibold text-blue-300">Spring Damping</div>
          <div className="text-xl font-bold text-white mt-1">0.82</div>
        </GlowingCard>
      </GlowingCards>
    ),
    codeSnippet: `import { GlowingCards, GlowingCard } from '@/components/lightswind/glowing-cards'

<GlowingCards gap="1rem">
  <GlowingCard className="p-4">Card 1</GlowingCard>
  <GlowingCard className="p-4">Card 2</GlowingCard>
</GlowingCards>`,
  },

  // 9. SpringSelect
  {
    id: 'spring-select',
    name: 'SpringSelect',
    category: 'springs',
    categoryLabel: 'Spring Controls',
    badge: 'DesignPass',
    description: 'Euler spring-animated dropdown select with squash velocity, keyboard typeahead, and magnetic hover.',
    tamilDescription: 'ஸ்பிரிங் குதிப்புடன் திறக்கும் நவீன தேர்வுப் பெட்டி (Dropdown Select).',
    tags: ['select', 'dropdown', 'spring', 'physics', 'squish'],
    renderPreview: () => <SpringSelectPreview />,
    codeSnippet: `import { SpringSelect } from '@/components/ui/select/SpringSelect'

<SpringSelect
  options={[
    { value: 'pro', label: 'Pro Glass' },
    { value: 'free', label: 'Starter' }
  ]}
  value={value}
  onChange={setValue}
  magnet={true}
/>`,
  },

  // 10. SpringSlider
  {
    id: 'spring-slider',
    name: 'SpringSlider',
    category: 'springs',
    categoryLabel: 'Spring Controls',
    badge: 'DesignPass',
    description: 'Tactile spring-drag slider with velocity thumb squash and live value indicator.',
    tamilDescription: 'இழுக்கும் வேகத்திற்கேற்ப உருண்டையாக சுருங்கி விரியும் ஸ்பிரிங் ஸ்லைடர்.',
    tags: ['slider', 'range', 'spring', 'velocity'],
    renderPreview: () => <SpringSliderPreview />,
    codeSnippet: `import { SpringSlider } from '@/components/ui/slider/SpringSlider'

<SpringSlider
  value={val}
  onChange={setVal}
  min={0}
  max={100}
  label="Intensity"
  showValue={true}
/>`,
  },

  // 11. SpringAccordion
  {
    id: 'spring-accordion',
    name: 'SpringAccordion',
    category: 'springs',
    categoryLabel: 'Spring Controls',
    badge: 'DesignPass',
    description: 'Dynamic spring-height disclosure accordion with fluid physics and reduced-motion support.',
    tamilDescription: 'மென்மையாக ஸ்பிரிங் போல விரிந்து சுருங்கும் அக்கார்டியன் பட்டியல்.',
    tags: ['accordion', 'disclosure', 'spring', 'collapsible'],
    renderPreview: () => <SpringAccordionPreview />,
    codeSnippet: `import { SpringAccordion } from '@/components/ui/accordion/SpringAccordion'

<SpringAccordion
  items={[
    { id: '1', title: 'Title', content: 'Details...' }
  ]}
  type="single"
/>`,
  },

  // 12. GlassField
  {
    id: 'glass-field',
    name: 'GlassField',
    category: 'fields',
    categoryLabel: 'Inputs & Fields',
    badge: 'Core UI',
    description: 'Frosted glass input field with integrated icon badge and neon glowing focus ring.',
    tamilDescription: 'மங்கலான கண்ணாடியில் ஐகானுடன் கூடிய தட்டச்சு உள்ளீட்டுப் பெட்டி (Input Field).',
    tags: ['input', 'field', 'glass', 'icon'],
    renderPreview: () => <GlassFieldPreview />,
    codeSnippet: `import { GlassField } from '@/components/ui/fields/GlassField'

<GlassField
  label="Email Address"
  icon="mail"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>`,
  },

  // 13. PasswordField
  {
    id: 'password-field',
    name: 'PasswordField',
    category: 'fields',
    categoryLabel: 'Inputs & Fields',
    badge: 'Core UI',
    description: 'Glass password field with accessible eye toggle button and keyboard navigation.',
    tamilDescription: 'கடவுச்சொல்லைக் காட்டும்/மறைக்கும் கண் ஐகானுடன் கூடிய உள்ளீட்டுப் பெட்டி.',
    tags: ['input', 'password', 'toggle', 'accessible'],
    renderPreview: () => <PasswordFieldPreview />,
    codeSnippet: `import { PasswordField } from '@/components/ui/fields/PasswordField'

<PasswordField
  label="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>`,
  },

  // 14. FloatingField
  {
    id: 'floating-field',
    name: 'FloatingField',
    category: 'fields',
    categoryLabel: 'Inputs & Fields',
    badge: 'Core UI',
    description: 'Glassmorphism input with smooth floating label elevation on focus or filled value.',
    tamilDescription: 'தட்டச்சு செய்யும் போது தலைப்பு மேலே மிதக்கும் உள்ளீட்டுப் பெட்டி (Floating Label).',
    tags: ['input', 'floating-label', 'glass'],
    renderPreview: () => <FloatingFieldPreview />,
    codeSnippet: `import { FloatingField } from '@/components/ui/fields/FloatingField'

<FloatingField
  label="Full Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>`,
  },

  // 15. GlowText
  {
    id: 'glow-text',
    name: 'GlowText',
    category: 'typography',
    categoryLabel: 'Typography & Text',
    badge: 'Core UI',
    description: 'Text enhanced with soft ambient neon radial shadow illumination.',
    tamilDescription: 'பின்னணியில் மென்மையான நியான் ஒளியுடன் திகழும் உரை (Text).',
    tags: ['text', 'glow', 'neon'],
    renderPreview: () => (
      <div className="flex flex-col gap-2">
        <GlowText as="h3" glowColor="#a855f7" className="text-xl font-bold">
          Neon Purple Glow
        </GlowText>
        <GlowText as="p" glowColor="#38bdf8" className="text-sm">
          Cyan ambient aura heading
        </GlowText>
      </div>
    ),
    codeSnippet: `import { GlowText } from '@/components/ui/text/GlowText'

<GlowText as="h3" glowColor="#a855f7">Neon Purple Glow</GlowText>`,
  },

  // 16. GradientText
  {
    id: 'gradient-text',
    name: 'GradientText',
    category: 'typography',
    categoryLabel: 'Typography & Text',
    badge: 'Core UI',
    description: 'Multi-stop gradient clipped text with rich color transition.',
    tamilDescription: 'பல வண்ணக் கலவையில் அமைந்த கவர்ச்சிகரமான தலைப்பு உரை.',
    tags: ['text', 'gradient', 'typography'],
    renderPreview: () => (
      <GradientText as="h2" className="text-2xl font-black">
        Glassmorphic Dashboard UI
      </GradientText>
    ),
    codeSnippet: `import { GradientText } from '@/components/ui/text/GradientText'

<GradientText as="h2" className="text-2xl font-black">
  Glassmorphic Dashboard UI
</GradientText>`,
  },

  // 17. ShimmerText
  {
    id: 'shimmer-text',
    name: 'ShimmerText',
    category: 'typography',
    categoryLabel: 'Typography & Text',
    badge: 'Core UI',
    description: 'Dynamic text with an infinite flowing light shimmer animation.',
    tamilDescription: 'தொடர்ந்து ஒளி அலைகள் ஓடும் மின்னும் உரை விளைவு.',
    tags: ['text', 'shimmer', 'animation'],
    renderPreview: () => (
      <ShimmerText as="div" className="text-lg font-semibold">
        ✨ Enterprise Glass Architecture 2026
      </ShimmerText>
    ),
    codeSnippet: `import { ShimmerText } from '@/components/ui/text/ShimmerText'

<ShimmerText as="div" className="text-lg font-semibold">
  Enterprise Glass Architecture
</ShimmerText>`,
  },

  // 18. AnimatedText
  {
    id: 'animated-text',
    name: 'AnimatedText',
    category: 'typography',
    categoryLabel: 'Typography & Text',
    badge: 'Core UI',
    description: 'Universal polymorphic animated text supporting gradient, shimmer, glow, and fadeIn modes.',
    tamilDescription: 'அனைத்து வகை அனிமேஷன்களையும் ஆதரிக்கும் பன்முக உரை கூறு.',
    tags: ['text', 'polymorphic', 'variants'],
    renderPreview: () => (
      <div className="flex flex-col gap-1">
        <AnimatedText variant="gradient" className="text-base font-bold">
          Polymorphic Gradient Mode
        </AnimatedText>
        <AnimatedText variant="shimmer" className="text-sm">
          Polymorphic Shimmer Mode
        </AnimatedText>
      </div>
    ),
    codeSnippet: `import { AnimatedText } from '@/components/ui/AnimatedText'

<AnimatedText as="h3" variant="gradient">Polymorphic Gradient</AnimatedText>
<AnimatedText as="p" variant="shimmer">Polymorphic Shimmer</AnimatedText>`,
  },

  // 19. Icon
  {
    id: 'icon-system',
    name: 'Icon',
    category: 'buttons',
    categoryLabel: 'Buttons & Icons',
    badge: 'Core UI',
    description: 'Lightweight inline SVG icon set supporting user, mail, lock, eye, arrow, and sparkles icons.',
    tamilDescription: 'திட்டத்திற்கான எளிய மற்றும் நேர்த்தியான SVG ஐகான் தொகுதி.',
    tags: ['icon', 'svg', 'ui'],
    renderPreview: () => (
      <div className="flex items-center gap-4 text-purple-300">
        <span className="p-2 rounded-lg bg-white/5 border border-white/10" title="user">
          <Icon name="user" className="size-5" />
        </span>
        <span className="p-2 rounded-lg bg-white/5 border border-white/10" title="mail">
          <Icon name="mail" className="size-5" />
        </span>
        <span className="p-2 rounded-lg bg-white/5 border border-white/10" title="lock">
          <Icon name="lock" className="size-5" />
        </span>
        <span className="p-2 rounded-lg bg-white/5 border border-white/10" title="arrow">
          <Icon name="arrow" className="size-5" />
        </span>
        <span className="p-2 rounded-lg bg-white/5 border border-white/10" title="eye">
          <Icon name="eye" className="size-5" />
        </span>
      </div>
    ),
    codeSnippet: `import { Icon } from '@/components/ui/icons/Icon'

<Icon name="user" className="size-5" />
<Icon name="mail" className="size-5" />
<Icon name="lock" className="size-5" />
<Icon name="arrow" className="size-5" />`,
  },
]

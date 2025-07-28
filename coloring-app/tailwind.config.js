/**
 * Tailwind CSS Configuration for Coloring Book Generator
 * 
 * Enhanced configuration with comprehensive design system including
 * pastel color palette, custom animations, and responsive utilities.
 * 
 * Evidence: architecture.md Section 2.1 - Design System Configuration
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Shadcn UI color system
      colors: {
        // Base Shadcn colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Custom Pastel Color Palette - Evidence: architecture.md Section 2.1.1
        'pastel-pink': {
          DEFAULT: '#F9F5F6',
          50: '#FEFCFD',
          100: '#FCF9FA',
          200: '#F9F5F6',
          300: '#F5F0F2',
          400: '#F1EBEE',
          500: '#EDE6EA',
          600: '#E9E1E6',
          700: '#E5DCE2',
          800: '#E1D7DE',
          900: '#DDD2DA'
        },
        'pastel-blue': {
          DEFAULT: '#A7C7E7',
          50: '#F7FAFD',
          100: '#EEF5FB',
          200: '#DDE9F7',
          300: '#CCDEF3',
          400: '#BBD2EF',
          500: '#A7C7E7',
          600: '#8BB5E0',
          700: '#6FA3D9',
          800: '#5391D2',
          900: '#4077B8'
        },
        'pastel-green': {
          DEFAULT: '#D7E4BC',
          50: '#F8FBEF',
          100: '#F1F7DF',
          200: '#E9F3CF',
          300: '#E1EFBF',
          400: '#D9EBAF',
          500: '#D7E4BC', 
          600: '#C5D89A',
          700: '#B3CC78',
          800: '#A1C056',
          900: '#8FB434'
        },
        'pastel-purple': {
          DEFAULT: '#C7A7E7',
          50: '#F8F4FD',
          100: '#F1E9FB',
          200: '#E9DEF7',
          300: '#E1D3F3',
          400: '#D9C8EF',
          500: '#C7A7E7',
          600: '#B58BE0',
          700: '#A36FD9',
          800: '#9153D2',
          900: '#7F37B8'
        },
        
        // Semantic colors
        'accent-pink': '#FFE6E6',
        'error-pink': '#FF6B81',
        'success-green': '#10B981',
        'warning-yellow': '#F59E0B',
        'info-blue': '#3B82F6',
        
        // Interactive states
        'hover-blue': '#5067C9',
        'focus-blue': '#4C63D2',
        'active-blue': '#475FCC',
        
        // System colors
        'dark-mode': {
          DEFAULT: '#2D3A56',
          light: '#3E4B67',
          dark: '#1C2738'
        },
        'muted-gray': {
          DEFAULT: '#8A94A6',
          light: '#A5B0C1',
          dark: '#6F788B'
        },
        
        // Validation states
        'field-valid': '#10B981',
        'field-invalid': '#EF4444',
        'field-warning': '#F59E0B'
      },
      // Enhanced border radius system
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'crayon': '16px',
        'soft': '12px',
        'button': '20px'
      },
      
      // Typography system - Evidence: architecture.md Section 2.1.2
      fontFamily: {
        'handlee': ['Handlee', 'cursive'],
        'inter': ['Inter', 'sans-serif'],
        'system': ['system-ui', 'sans-serif']
      },
      
      fontSize: {
        'handlee-sm': ['14px', { lineHeight: '1.4', fontFamily: 'Handlee' }],
        'handlee-base': ['16px', { lineHeight: '1.5', fontFamily: 'Handlee' }],
        'handlee-lg': ['18px', { lineHeight: '1.6', fontFamily: 'Handlee' }],
        'handlee-xl': ['24px', { lineHeight: '1.4', fontFamily: 'Handlee' }],
        'handlee-2xl': ['32px', { lineHeight: '1.3', fontFamily: 'Handlee' }]
      },
      
      // Spacing system for consistent layout
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem'
      },
      
      // Enhanced animation system - Evidence: architecture.md Section 2.3
      animation: {
        // Existing animations
        'crayon-draw': 'crayon-draw 2s ease-in forwards',
        'pulse-generate': 'pulse-generate 1s infinite',
        'bounce-button': 'bounce-button 0.2s ease-in-out',
        'wobble': 'wobble 2s ease-in-out',
        'fade-in': 'fade-in 0.8s ease-out forwards',
        
        // New animations
        'success-celebration': 'success-celebration 0.6s ease-in-out',
        'confetti-fall': 'confetti-fall 3s ease-out forwards',
        'icon-float': 'icon-float 3s ease-in-out infinite',
        'border-shimmer': 'border-shimmer 3s ease-in-out infinite',
        'focus-glow': 'focus-glow 0.3s ease-in',
        'tooltip-fade-in': 'tooltip-fade-in 0.3s ease-in forwards',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-gentle': 'bounce-gentle 2s infinite'
      },
      
      keyframes: {
        // Existing keyframes
        'crayon-draw': {
          'from': { 'stroke-dashoffset': '100', opacity: '0.3' },
          'to': { 'stroke-dashoffset': '0', opacity: '1' },
        },
        'pulse-generate': {
          '0%, 100%': { 
            transform: 'scale(1)', 
            'box-shadow': '0 0 0 0 rgba(167, 199, 231, 0.7)' 
          },
          '50%': { 
            transform: 'scale(1.02)', 
            'box-shadow': '0 0 0 8px rgba(167, 199, 231, 0)' 
          },
        },
        'bounce-button': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'wobble': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-1px) rotate(0.5deg)' },
          '50%': { transform: 'translateY(0px) rotate(-0.5deg)' },
          '75%': { transform: 'translateY(1px) rotate(0.3deg)' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'scale(0.9) translateY(20px)' },
          'to': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        
        // New keyframes
        'success-celebration': {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1) rotate(2deg)' },
          '50%': { transform: 'scale(1.05) rotate(-2deg)' },
          '75%': { transform: 'scale(1.1) rotate(1deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' }
        },
        'confetti-fall': {
          '0%': { 
            opacity: '1', 
            transform: 'translateY(0) rotate(0deg) scale(0.3)' 
          },
          '25%': { 
            opacity: '1', 
            transform: 'translateY(-30px) rotate(90deg) scale(1.2)' 
          },
          '50%': { 
            opacity: '1', 
            transform: 'translateY(-60px) rotate(180deg) scale(1)' 
          },
          '75%': { 
            opacity: '0.8', 
            transform: 'translateY(-90px) rotate(270deg) scale(0.8)' 
          },
          '100%': { 
            opacity: '0', 
            transform: 'translateY(-120px) rotate(360deg) scale(0.2)' 
          }
        },
        'icon-float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-2px) rotate(2deg)' }
        },
        'border-shimmer': {
          '0%, 100%': { 'border-color': '#CCC' },
          '50%': { 'border-color': '#A7C7E7' }
        },
        'focus-glow': {
          'from': { 'box-shadow': '0 0 0 0 rgba(167, 199, 231, 0.5)' },
          'to': { 'box-shadow': '0 0 0 4px rgba(167, 199, 231, 0.3)' }
        },
        'tooltip-fade-in': {
          'from': { 
            opacity: '0', 
            transform: 'translateX(-50%) translateY(10px)' 
          },
          'to': { 
            opacity: '1', 
            transform: 'translateX(-50%) translateY(0)' 
          }
        },
        'bounce-gentle': {
          '0%, 20%, 53%, 80%, 100%': {
            'animation-timing-function': 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
            transform: 'translate3d(0,0,0)'
          },
          '40%, 43%': {
            'animation-timing-function': 'cubic-bezier(0.755, 0.050, 0.855, 0.060)',
            transform: 'translate3d(0, -10px, 0)'
          },
          '70%': {
            'animation-timing-function': 'cubic-bezier(0.755, 0.050, 0.855, 0.060)',
            transform: 'translate3d(0, -5px, 0)'
          },
          '90%': { transform: 'translate3d(0,-2px,0)' }
        }
      },
      
      // Box shadow system
      boxShadow: {
        'crayon': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'hover': '0 8px 25px rgba(0, 0, 0, 0.1)',
        'focus': '0 0 0 4px rgba(167, 199, 231, 0.3)',
        'button': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'success': '0 0 0 4px rgba(16, 185, 129, 0.3)',
        'error': '0 0 0 4px rgba(239, 68, 68, 0.3)'
      },
      
      // Screen breakpoints - Evidence: architecture.md Section 2.4
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'mobile': { 'max': '768px' },
        'tablet': { 'min': '769px', 'max': '1023px' },
        'desktop': { 'min': '1024px' }
      },
      
      // Z-index scale
      zIndex: {
        'behind': '-1',
        'base': '0',
        'content': '1',
        'header': '10',
        'tooltip': '100',
        'modal': '1000',
        'mobile-button': '1000'
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    
    // Custom utility plugins
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow-sm': {
          'text-shadow': '1px 1px 2px rgba(0, 0, 0, 0.1)'
        },
        '.text-shadow': {
          'text-shadow': '2px 2px 4px rgba(0, 0, 0, 0.2)'
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden'
        },
        '.transform-gpu': {
          'transform': 'translateZ(0)'
        }
      })
    }
  ],
}
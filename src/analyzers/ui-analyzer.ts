import { ProjectContext, NextAction } from "../context/project-context.js";

export class UIAnalyzer {
  generateUIActions(context: ProjectContext): NextAction[] {
    const actions: NextAction[] = [];

    if (!context.hasFrontend) return actions;

    // Loading states
    actions.push({
      id: "ui-loading-states",
      category: "ui-ux",
      priority: "high",
      title: "⏳ Implement Comprehensive Loading & Skeleton States",
      description:
        "Add loading skeletons and states throughout the application for better perceived performance",
      prompt: `Help me implement comprehensive loading states and skeleton screens in my ${context.frontendFramework || context.framework} application:

1. **Skeleton Screens**:
   - Create skeleton components that match the layout of loaded content
   - Implement for: cards, lists, tables, profile sections, etc.
   - Use shimmer animation effect
   
2. **Loading States**:
   - Button loading states (spinner + disabled state)
   - Page-level loading with proper UX
   - Optimistic UI updates for mutations
   - Progressive loading for long lists

3. **Implementation**:
   ${
     context.framework === "nextjs"
       ? "- Use Next.js loading.tsx files for route-level loading\n   - Implement React Suspense boundaries\n   - Use the new streaming SSR features"
       : context.framework === "react"
         ? "- Use React Suspense + lazy loading\n   - Implement React Query/SWR loading states"
         : "- Show framework-appropriate loading patterns"
   }

4. **Error States**:
   - Empty states with helpful CTAs
   - Error boundaries with retry functionality
   - Network error handling with offline detection

Please analyze my current components and identify where loading states are missing, then implement them systematically.`,
      rationale:
        "Loading states significantly improve perceived performance and user satisfaction",
      estimatedImpact: "high",
      tags: ["ui", "ux", "loading", "skeleton", "performance"],
    });

    // Accessibility
    actions.push({
      id: "ui-accessibility",
      category: "accessibility",
      priority: "high",
      title: "♿ Implement WCAG 2.1 AA Accessibility Standards",
      description: "Audit and fix accessibility issues to meet WCAG 2.1 AA compliance",
      prompt: `Help me implement comprehensive accessibility (a11y) improvements in my ${context.frontendFramework || context.framework} application to meet WCAG 2.1 AA standards:

1. **Semantic HTML**:
   - Audit and fix improper heading hierarchy
   - Replace div-soup with semantic elements (article, section, nav, main, aside)
   - Ensure forms have proper labels and fieldsets

2. **Keyboard Navigation**:
   - Implement proper focus management
   - Add focus trapping in modals/dialogs
   - Ensure all interactive elements are keyboard accessible
   - Add skip-to-main-content link

3. **ARIA Labels & Roles**:
   - Add aria-label, aria-labelledby, aria-describedby
   - Implement aria-live regions for dynamic content
   - Add role attributes where needed

4. **Color & Contrast**:
   - Check color contrast ratios (minimum 4.5:1 for normal text)
   - Don't rely on color alone to convey information
   - Add focus visible styles

5. **Screen Reader Support**:
   - Test with VoiceOver/NVDA
   - Add alt text to all meaningful images
   - Handle icon buttons properly

6. **Tools & Testing**:
   - Set up axe-core for automated testing
   - Add eslint-plugin-jsx-a11y
   - Create accessibility test suite

Please audit my components and provide specific fixes.`,
      rationale:
        "Accessibility is both a legal requirement and improves UX for all users",
      estimatedImpact: "high",
      tags: ["accessibility", "a11y", "wcag", "ui"],
    });

    // Dark mode
    const hasDarkMode = context.files.some(
      (f) =>
        f.content?.includes("dark:") ||
        f.content?.includes("darkMode") ||
        f.content?.includes("color-scheme")
    );

    if (!hasDarkMode) {
      actions.push({
        id: "ui-dark-mode",
        category: "ui-ux",
        priority: "medium",
        title: "🌙 Implement Dark Mode",
        description:
          "Add dark mode support with system preference detection and manual toggle",
        prompt: `Implement a complete dark mode system for my ${context.frontendFramework || context.framework} application:

1. **Setup**:
   ${
     context.dependencies.some((d) => d.name === "tailwindcss")
       ? "- Configure Tailwind CSS dark mode (class-based strategy)\n   - Set up ThemeProvider component"
       : "- Create CSS custom properties for color tokens\n   - Implement theme switching mechanism"
   }

2. **Theme Storage**:
   - Save user preference in localStorage
   - Respect prefers-color-scheme media query
   - Prevent flash of wrong theme (FOUT) on initial load
   
3. **Components to Theme**:
   - Background colors, text, borders
   - Cards, modals, dropdowns
   - Input fields, buttons
   - Code blocks, tables
   - Navigation and sidebar
   
4. **Theme Toggle**:
   - Create accessible toggle component (button or dropdown: Light/Dark/System)
   - Add smooth transitions between themes
   - Place in appropriate UI location

5. **Testing**:
   - Test all components in both modes
   - Check image and icon visibility
   - Verify contrast ratios in dark mode

Please implement this systematically across all my existing components.`,
        rationale: "Dark mode is expected by modern users and reduces eye strain",
        estimatedImpact: "medium",
        tags: ["ui", "dark-mode", "theme", "user-preference"],
      });
    }

    // Responsive design
    actions.push({
      id: "ui-responsive",
      category: "ui-ux",
      priority: "high",
      title: "📱 Audit & Improve Responsive Design",
      description: "Ensure the application works flawlessly across all device sizes",
      prompt: `Help me audit and improve the responsive design of my ${context.frontendFramework || context.framework} application:

1. **Mobile-First Audit**:
   - Check all pages on mobile (320px, 375px, 414px)
   - Check tablet (768px, 1024px)
   - Check desktop (1280px, 1440px, 1920px)
   - Identify layout breaking points

2. **Navigation**:
   - Implement mobile hamburger menu
   - Bottom navigation bar for mobile (if appropriate)
   - Ensure touch targets are at least 44x44px

3. **Typography**:
   - Implement fluid typography (clamp())
   - Ensure readable font sizes on mobile (min 16px body)
   - Fix text overflow issues

4. **Images & Media**:
   - Implement responsive images with srcset
   - Add proper aspect ratios to prevent layout shift
   - Use Next.js Image component or equivalent

5. **Tables & Complex UI**:
   - Make tables horizontally scrollable or card-based on mobile
   - Stack form layouts on mobile
   - Adjust grid layouts for different breakpoints

6. **Touch Experience**:
   - Add touch gestures where appropriate
   - Remove hover-only interactions on touch devices
   - Test with actual touch events

Please analyze my current layout and provide specific improvements.`,
      rationale: "Mobile users account for 60%+ of web traffic",
      estimatedImpact: "high",
      tags: ["ui", "responsive", "mobile", "ux"],
    });

    // Error handling UX
    actions.push({
      id: "ui-error-handling",
      category: "ui-ux",
      priority: "medium",
      title: "🚫 Implement User-Friendly Error Handling",
      description:
        "Create a comprehensive error handling system with helpful user feedback",
      prompt: `Implement comprehensive user-friendly error handling in my ${context.frontendFramework || context.framework} application:

1. **Error Boundaries**:
   - Create a global ErrorBoundary component
   - Add route-level error boundaries
   - Implement component-level error boundaries for isolated failures
   - Design beautiful error UI with recovery options

2. **Form Validation Errors**:
   - Real-time validation feedback
   - Clear, helpful error messages (not "Invalid input")
   - Highlight specific fields with errors
   - Accessible error announcements for screen readers

3. **API Error Handling**:
   - Create error interceptor/middleware
   - Map HTTP status codes to user-friendly messages
   - Handle network errors (offline, timeout)
   - Implement retry logic for transient errors

4. **Toast/Notification System**:
   - Success, error, warning, and info toasts
   - Auto-dismiss with configurable duration
   - Queue management for multiple notifications
   - Accessible announcements

5. **404 & Empty States**:
   - Create beautiful 404 page with navigation
   - Empty state components with CTAs
   - No results state for search/filters

6. **Offline Support**:
   - Detect network status
   - Show offline banner
   - Queue actions for when connection returns

Please implement this across my application systematically.`,
      rationale: "Good error handling dramatically improves user trust and retention",
      estimatedImpact: "high",
      tags: ["ui", "error-handling", "ux", "notifications"],
    });

    return actions;
  }
}

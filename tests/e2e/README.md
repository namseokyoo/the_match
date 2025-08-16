# E2E Test Suite Documentation

## Overview

The E2E test suite for The Match platform covers comprehensive testing scenarios including authentication, match management, team management, and mobile responsive design.

## Test Files

### 1. Authentication Tests (`auth.spec.ts`)
- User registration and login flows
- Authentication state management
- Access control and redirects

### 2. Match Management Tests (`match.spec.ts`)
- Match creation and management
- Team participation workflows
- Match status updates and results

### 3. Team Management Tests (`team.spec.ts`)
- Team creation and management
- Player management
- Team joining workflows

### 4. Mobile Responsive & UX Tests (`mobile.spec.ts`)
- **NEW**: Comprehensive mobile testing across multiple devices and viewports
- Cross-browser compatibility testing
- Touch interaction and accessibility testing
- Performance and offline behavior testing

## Mobile Test Suite Features

### Device Coverage
- **iPhone 14**: 390x844px (iOS Mobile)
- **Samsung Galaxy S23**: 360x780px (Android Mobile)
- **iPad Air**: 820x1180px (iOS Tablet)
- **Desktop**: 1920x1080px (Desktop)

### Viewport Testing
- Mobile Small: 320x568px
- Mobile Medium: 375x667px
- Mobile Large: 414x896px
- Tablet Portrait: 768x1024px
- Tablet Landscape: 1024x768px
- Desktop Small: 1200x800px
- Desktop Large: 1920x1080px

### Test Categories

#### 1. Responsive Design Tests
- Layout adaptation across different screen sizes
- Navigation menu behavior (hamburger menu, bottom navigation)
- Content overflow prevention
- Visual regression testing with screenshots

#### 2. Mobile Navigation Tests
- Bottom navigation functionality
- Header menu interactions
- Page navigation between sections
- URL routing validation

#### 3. Touch Interaction Tests
- Touch target size compliance (44x44px minimum for critical elements)
- Scroll behavior testing
- Tap and long press interactions
- Gesture support validation

#### 4. Performance Tests
- 3G network simulation and loading times
- Lazy loading validation for images
- Loading states and skeleton screens
- Performance budget compliance

#### 5. Offline & Network Tests
- Offline state handling
- Network failure recovery
- Service worker functionality
- Cache behavior validation

#### 6. Accessibility Tests
- Keyboard navigation support
- Focus indicator visibility
- Touch target accessibility compliance
- Cross-device consistency

#### 7. PWA Features Tests
- Service worker registration
- App manifest validation
- Install prompt behavior
- Offline functionality

## Test Execution

### Running All Tests
```bash
npm run test:e2e
```

### Running Specific Test Files
```bash
npm run test:e2e tests/e2e/mobile.spec.ts
npm run test:e2e tests/e2e/auth.spec.ts
npm run test:e2e tests/e2e/match.spec.ts
npm run test:e2e tests/e2e/team.spec.ts
```

### Running Tests in Specific Browsers
```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari only
npx playwright test --project=webkit

# Mobile browsers
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Running Tests with UI
```bash
npx playwright test --ui
```

### Debug Mode
```bash
npx playwright test --debug
```

## Test Results and Reports

### HTML Report
After test execution, view the HTML report:
```bash
npx playwright show-report
```

### Screenshots and Videos
- Test failures automatically capture screenshots
- Videos are recorded for debugging
- Screenshots stored in `test-results/` directory

### Performance Monitoring
- Load time tracking (should be <10s on 3G)
- Resource usage monitoring
- Core Web Vitals validation

## Configuration

### Playwright Configuration
- Located in `playwright.config.ts`
- Configured for multiple browsers and devices
- Screenshot and video recording enabled for failures

### Environment Setup
- Base URL: `https://the-match-five.vercel.app`
- Test timeout: 30 seconds per test
- Retry policy: 2 retries on failure

## Best Practices

### Writing Tests
1. **Use proper selectors**: Prefer data-testid attributes and semantic selectors
2. **Wait for elements**: Always wait for page ready state and element visibility
3. **Handle async operations**: Use proper waiting strategies for dynamic content
4. **Clean up**: Close contexts and pages to prevent memory leaks

### Mobile Testing
1. **Test on real devices when possible**: Emulation is good but real devices are better
2. **Consider touch interactions**: Use tap() instead of click() for mobile devices
3. **Test offline scenarios**: Mobile users often have poor connectivity
4. **Validate performance**: Mobile devices have limited resources

### Accessibility
1. **Test keyboard navigation**: Ensure all functionality is keyboard accessible
2. **Validate touch targets**: Minimum 44x44px for iOS, 48x48px for Android
3. **Check focus indicators**: Visual focus should be clearly visible
4. **Test with screen readers**: Use accessibility tools for validation

## Known Issues and Limitations

### Current Issues
1. **Touch target sizes**: Some UI elements may be smaller than ideal touch targets
2. **Network simulation**: 3G simulation may not perfectly match real network conditions
3. **Offline testing**: Limited offline functionality currently implemented

### Planned Improvements
1. **Visual regression testing**: Implement pixel-perfect comparison
2. **Performance budgets**: Add strict performance monitoring
3. **Accessibility automation**: Integrate axe-core for automated accessibility testing
4. **Real device testing**: Set up cloud-based real device testing

## Maintenance

### Regular Tasks
1. **Update selectors**: When UI changes, update corresponding selectors
2. **Review screenshots**: Check visual regression screenshots for accuracy
3. **Performance monitoring**: Monitor and update performance expectations
4. **Browser updates**: Keep Playwright and browser versions updated

### Troubleshooting
1. **Flaky tests**: Increase wait times and improve element selectors
2. **Network issues**: Check base URL and network connectivity
3. **Browser compatibility**: Test across all supported browsers
4. **Device-specific issues**: Use device-specific debugging tools

## Integration with CI/CD

### GitHub Actions
Tests are integrated with the deployment pipeline:
1. Run on every pull request
2. Block deployment if critical tests fail
3. Generate and archive test reports
4. Notify team of test failures

### Performance Gates
- Page load time must be <10 seconds on 3G
- No accessibility violations in critical paths
- All responsive breakpoints must pass layout tests

## Contact and Support

For test-related questions or issues:
1. Check this documentation first
2. Review test failure screenshots and videos
3. Check GitHub Issues for known problems
4. Contact the development team for assistance
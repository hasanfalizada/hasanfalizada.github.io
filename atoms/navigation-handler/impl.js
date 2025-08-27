// +++===+++ 2025-08-27 08:50 UTC — Hasan Alizada — Updated Navigation Handler with Resume as default, removed Home

class NavigationHandler {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.navigationState = {
            currentHash: '',
            currentSection: 'resume', // Changed default from 'home' to 'resume'
            previousHash: '',
            scrollPosition: 0,
            lastNavigationTime: 0
        };
        this.config = {
            enableHistory: true,
            enableScrollMemory: true,
            scrollOffset: 80,
            animationDuration: 800,
            debounceDelay: 100
        };
        this.debounceTimer = null;
        console.log('+++===+++ NavigationHandler initialized');
    }

    /**
     * Navigates to specific section and updates URL hash
     * @param {string} sectionId - Section ID to navigate to
     * @param {boolean} updateHistory - Whether to update browser history
     * @param {boolean} smoothScroll - Whether to use smooth scrolling
     * @returns {{success: boolean, currentSection: string, error: string|null}}
     */
    routeToSection(sectionId, updateHistory = true, smoothScroll = true) {
        console.log(`+++===+++ Routing to section: ${sectionId}`);

        try {
            // Validate section exists
            const targetSection = document.getElementById(sectionId);
            if (!targetSection && sectionId !== 'resume') {
                console.warn(`+++===+++ Section ${sectionId} not found, defaulting to resume`);
                sectionId = 'resume';
            }

            // Update navigation state
            this.navigationState.previousHash = this.navigationState.currentHash;
            this.navigationState.currentHash = sectionId === 'resume' ? '' : sectionId; // Empty hash for resume
            this.navigationState.currentSection = sectionId;
            this.navigationState.lastNavigationTime = Date.now();

            // Update URL if requested
            if (updateHistory && this.config.enableHistory) {
                const newUrl = sectionId === 'resume' ? '#' : `#${sectionId}`;
                this.updateURL(newUrl, this.generatePageTitle(sectionId));
            }

            // Update active section visibility
            this.updateSectionVisibility(sectionId);

            // Update active navigation
            this.updateActiveNavigation(sectionId);

            // Scroll to section if not resume
            if (sectionId !== 'resume' && smoothScroll) {
                this.scrollToSection(sectionId, this.config.scrollOffset, 'smooth');
            }

            console.log(`+++===+++ Successfully routed to section: ${sectionId}`);
            return {
                success: true,
                currentSection: sectionId,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error routing to section:', error);
            return {
                success: false,
                currentSection: this.navigationState.currentSection,
                error: error.message
            };
        }
    }

    /**
     * Updates browser URL and history state
     * @param {string} hash - URL hash
     * @param {string} title - Page title
     * @param {boolean} replaceState - Whether to replace current state
     * @returns {{success: boolean, currentUrl: string, error: string|null}}
     */
    updateURL(hash, title = '', replaceState = false) {
        console.log(`+++===+++ Updating URL to: ${hash}`);

        try {
            const cleanHash = hash.startsWith('#') ? hash : `#${hash}`;
            const newUrl = `${window.location.origin}${window.location.pathname}${cleanHash}`;

            if (this.config.enableHistory) {
                const stateData = {
                    section: hash.replace('#', '') || 'resume',
                    timestamp: Date.now(),
                    scrollPosition: window.pageYOffset
                };

                if (replaceState) {
                    window.history.replaceState(stateData, title, newUrl);
                } else {
                    window.history.pushState(stateData, title, newUrl);
                }

                // Update page title if provided
                if (title) {
                    document.title = title;
                }
            }

            console.log('+++===+++ URL updated successfully');
            return {
                success: true,
                currentUrl: newUrl,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error updating URL:', error);
            return {
                success: false,
                currentUrl: window.location.href,
                error: error.message
            };
        }
    }

    /**
     * Handles browser back/forward navigation events
     * @returns {{success: boolean, currentHash: string, error: string|null}}
     */
    handleBrowserNavigation() {
        console.log('+++===+++ Handling browser navigation');

        try {
            const hash = window.location.hash.substring(1);
            const sectionId = hash || 'resume'; // Default to resume if no hash

            // Debounce navigation handling
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            this.debounceTimer = setTimeout(() => {
                this.routeToSection(sectionId, false, true);
            }, this.config.debounceDelay);

            return {
                success: true,
                currentHash: hash,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error handling browser navigation:', error);
            return {
                success: false,
                currentHash: '',
                error: error.message
            };
        }
    }

    /**
     * Smoothly scrolls to target section with custom offset and animation
     * @param {string} targetId - Target element ID
     * @param {number} offset - Scroll offset in pixels
     * @param {string} behavior - Scroll behavior (smooth, instant, auto)
     * @param {number} duration - Animation duration (for custom smooth scroll)
     * @returns {{success: boolean, scrollPosition: number, error: string|null}}
     */
    scrollToSection(targetId, offset = 0, behavior = 'smooth', duration = this.config.animationDuration) {
        console.log(`+++===+++ Scrolling to section: ${targetId}`);

        try {
            const targetElement = document.getElementById(targetId);
            if (!targetElement) {
                throw new Error(`Target element ${targetId} not found`);
            }

            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

            if (behavior === 'smooth' && 'scrollBehavior' in document.documentElement.style) {
                // Use native smooth scroll if supported
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            } else if (behavior === 'smooth') {
                // Custom smooth scroll implementation
                this.customSmoothScroll(targetPosition, duration);
            } else {
                // Instant scroll
                window.scrollTo(0, targetPosition);
            }

            this.navigationState.scrollPosition = targetPosition;

            console.log(`+++===+++ Scrolled to section: ${targetId} at position ${targetPosition}`);
            return {
                success: true,
                scrollPosition: targetPosition,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error scrolling to section:', error);
            return {
                success: false,
                scrollPosition: window.pageYOffset,
                error: error.message
            };
        }
    }

    /**
     * Custom smooth scroll implementation
     * @param {number} targetPosition - Target scroll position
     * @param {number} duration - Animation duration
     */
    customSmoothScroll(targetPosition, duration) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeInOutCubic)
            const easing = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const currentPosition = startPosition + (distance * easing);
            window.scrollTo(0, currentPosition);

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }

    /**
     * Initializes routing system and sets up event listeners
     * @param {array} routes - Route definitions
     * @param {string} defaultRoute - Default route
     * @returns {{success: boolean, activeRoute: string, error: string|null}}
     */
    initializeRouting(routes, defaultRoute = 'resume') { // Changed default from 'home' to 'resume'
        console.log('+++===+++ Initializing routing system');

        try {
            // Store routes
            routes.forEach(route => {
                this.routes.set(route.hash, route);
            });

            // Set up event listeners
            this.setupEventListeners();

            // Handle initial route
            const initialHash = window.location.hash.substring(1);
            const initialRoute = initialHash || defaultRoute;

            this.routeToSection(initialRoute, false, false);

            console.log(`+++===+++ Routing system initialized with ${routes.length} routes`);
            return {
                success: true,
                activeRoute: initialRoute,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error initializing routing:', error);
            return {
                success: false,
                activeRoute: defaultRoute,
                error: error.message
            };
        }
    }

    /**
     * Setup event listeners for navigation
     */
    setupEventListeners() {
        console.log('+++===+++ Setting up navigation event listeners');

        // Hash change event
        window.addEventListener('hashchange', () => {
            this.handleBrowserNavigation();
        });

        // Browser back/forward navigation
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                const sectionId = event.state.section || 'resume';
                this.routeToSection(sectionId, false, true);
            } else {
                this.handleBrowserNavigation();
            }
        });

        // Navigation link clicks
        document.addEventListener('click', (event) => {
            const navLink = event.target.closest('[data-section]');
            if (navLink) {
                event.preventDefault();
                const sectionId = navLink.getAttribute('data-section') || navLink.getAttribute('href').replace('#', '');
                this.routeToSection(sectionId, true, true);
            }
        });

        // Scroll events for active section detection
        if (this.config.enableScrollMemory) {
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.updateActiveNavigationOnScroll();
                }, 100);
            });
        }
    }

    /**
     * Updates navigation UI to reflect current active section
     * @param {string} activeSection - Active section ID
     * @param {string} navigationSelector - CSS selector for navigation links
     * @returns {{success: boolean, updatedElements: number, error: string|null}}
     */
    updateActiveNavigation(activeSection, navigationSelector = 'nav a[href^="#"], nav a[data-section]') {
        console.log(`+++===+++ Updating active navigation for: ${activeSection}`);

        try {
            const navLinks = document.querySelectorAll(navigationSelector);
            let updatedCount = 0;

            navLinks.forEach(link => {
                const linkSection = link.getAttribute('data-section') ||
                    link.getAttribute('href').replace('#', '') ||
                    'resume';

                if (linkSection === activeSection || (activeSection === 'resume' && linkSection === '')) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.classList.remove('active');
                    link.removeAttribute('aria-current');
                }
                updatedCount++;
            });

            console.log(`+++===+++ Updated ${updatedCount} navigation elements`);
            return {
                success: true,
                updatedElements: updatedCount,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error updating navigation:', error);
            return {
                success: false,
                updatedElements: 0,
                error: error.message
            };
        }
    }

    /**
     * Update section visibility
     * @param {string} activeSection - Active section ID
     */
    updateSectionVisibility(activeSection) {
        console.log(`+++===+++ Updating section visibility for: ${activeSection}`);

        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            if (section.id === activeSection) {
                section.classList.add('active');
                section.style.display = 'block';
                section.setAttribute('aria-hidden', 'false');
            } else {
                section.classList.remove('active');
                section.style.display = 'none';
                section.setAttribute('aria-hidden', 'true');
            }
        });
    }

    /**
     * Update active navigation based on scroll position
     */
    updateActiveNavigationOnScroll() {
        const sections = document.querySelectorAll('.section');
        let currentSection = 'resume';

        const scrollPosition = window.pageYOffset + this.config.scrollOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.id;
            }
        });

        if (currentSection !== this.navigationState.currentSection) {
            this.navigationState.currentSection = currentSection;
            this.updateActiveNavigation(currentSection);
        }
    }

    /**
     * Generate page title for section
     * @param {string} sectionId - Section ID
     * @returns {string}
     */
    generatePageTitle(sectionId) {
        const baseName = 'Hasan Alizada - Technology Principal';

        switch (sectionId) {
            case 'resume':
                return `${baseName} | TOGAF®, PMP®, ITIL®, OCP®`;
            case 'blog':
                return `Technical Blog - ${baseName}`;
            default:
                return baseName;
        }
    }

    /**
     * Get current navigation state
     * @returns {object}
     */
    getCurrentState() {
        return {...this.navigationState};
    }

    /**
     * Update configuration
     * @param {object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = {...this.config, ...newConfig};
        console.log('+++===+++ Navigation configuration updated');
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationHandler;
} else {
    window.NavigationHandler = NavigationHandler;
}
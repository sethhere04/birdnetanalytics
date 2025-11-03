/**
 * Touch Gestures Module
 * Adds swipe navigation for mobile devices
 */

export class TouchGestureHandler {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50; // Minimum distance for a swipe
        this.maxVerticalDistance = 100; // Maximum vertical movement to still count as horizontal swipe
        this.isEnabled = false;
        this.onSwipeLeft = null;
        this.onSwipeRight = null;
        this.onSwipeUp = null;
        this.onSwipeDown = null;
    }

    /**
     * Initialize touch gesture handling
     */
    init() {
        // Only enable on mobile devices
        if (!this.isMobileDevice()) {
            console.log('[TouchGestures] Not a mobile device, gestures disabled');
            return;
        }

        this.isEnabled = true;
        this.attachListeners();
        console.log('[TouchGestures] Initialized');
    }

    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }

    /**
     * Attach touch event listeners
     */
    attachListeners() {
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(event) {
        if (!this.isEnabled) return;

        // Ignore if touching input elements, buttons, or scrollable areas
        const target = event.target;
        if (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'BUTTON' ||
            target.closest('.species-list') ||
            target.closest('.photo-gallery') ||
            target.closest('.timeline') ||
            target.closest('canvas')) {
            return;
        }

        this.touchStartX = event.changedTouches[0].screenX;
        this.touchStartY = event.changedTouches[0].screenY;
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd(event) {
        if (!this.isEnabled) return;

        this.touchEndX = event.changedTouches[0].screenX;
        this.touchEndY = event.changedTouches[0].screenY;

        this.handleGesture();
    }

    /**
     * Determine and handle the gesture
     */
    handleGesture() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Horizontal swipe (more horizontal than vertical)
        if (absDeltaX > this.minSwipeDistance && absDeltaX > absDeltaY) {
            if (deltaX > 0 && absDeltaY < this.maxVerticalDistance) {
                // Swipe right
                if (this.onSwipeRight) {
                    this.onSwipeRight();
                    this.showSwipeIndicator('right');
                }
            } else if (deltaX < 0 && absDeltaY < this.maxVerticalDistance) {
                // Swipe left
                if (this.onSwipeLeft) {
                    this.onSwipeLeft();
                    this.showSwipeIndicator('left');
                }
            }
        }
        // Vertical swipe (more vertical than horizontal)
        else if (absDeltaY > this.minSwipeDistance && absDeltaY > absDeltaX) {
            if (deltaY > 0) {
                // Swipe down
                if (this.onSwipeDown) {
                    this.onSwipeDown();
                    this.showSwipeIndicator('down');
                }
            } else {
                // Swipe up
                if (this.onSwipeUp) {
                    this.onSwipeUp();
                    this.showSwipeIndicator('up');
                }
            }
        }
    }

    /**
     * Show visual feedback for swipe gesture
     */
    showSwipeIndicator(direction) {
        // Create indicator element if it doesn't exist
        let indicator = document.getElementById('swipe-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'swipe-indicator';
            indicator.className = 'swipe-indicator';
            document.body.appendChild(indicator);
        }

        // Set direction class
        indicator.className = `swipe-indicator swipe-${direction}`;
        indicator.style.display = 'flex';

        // Set arrow based on direction
        const arrows = {
            left: '←',
            right: '→',
            up: '↑',
            down: '↓'
        };
        indicator.textContent = arrows[direction];

        // Remove after animation
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 300);
    }

    /**
     * Enable gestures
     */
    enable() {
        this.isEnabled = true;
    }

    /**
     * Disable gestures
     */
    disable() {
        this.isEnabled = false;
    }

    /**
     * Set swipe handlers
     */
    setHandlers(handlers) {
        if (handlers.onSwipeLeft) this.onSwipeLeft = handlers.onSwipeLeft;
        if (handlers.onSwipeRight) this.onSwipeRight = handlers.onSwipeRight;
        if (handlers.onSwipeUp) this.onSwipeUp = handlers.onSwipeUp;
        if (handlers.onSwipeDown) this.onSwipeDown = handlers.onSwipeDown;
    }
}

/**
 * Tab Navigation Helper
 * Provides swipe navigation between tabs
 */
export class TabSwipeNavigator {
    constructor(tabButtons, gestureHandler) {
        this.tabButtons = tabButtons;
        this.gestureHandler = gestureHandler;
        this.currentTabIndex = 0;
    }

    init() {
        // Get initial active tab
        this.updateCurrentTabIndex();

        // Set up swipe handlers
        this.gestureHandler.setHandlers({
            onSwipeLeft: () => this.navigateToNextTab(),
            onSwipeRight: () => this.navigateToPreviousTab()
        });

        console.log('[TabSwipeNavigator] Initialized with', this.tabButtons.length, 'tabs');
    }

    updateCurrentTabIndex() {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            this.currentTabIndex = Array.from(this.tabButtons).indexOf(activeTab);
        }
    }

    navigateToNextTab() {
        this.updateCurrentTabIndex();
        const nextIndex = (this.currentTabIndex + 1) % this.tabButtons.length;
        this.switchToTab(nextIndex);
    }

    navigateToPreviousTab() {
        this.updateCurrentTabIndex();
        const prevIndex = (this.currentTabIndex - 1 + this.tabButtons.length) % this.tabButtons.length;
        this.switchToTab(prevIndex);
    }

    switchToTab(index) {
        if (index >= 0 && index < this.tabButtons.length) {
            this.tabButtons[index].click();
        }
    }
}

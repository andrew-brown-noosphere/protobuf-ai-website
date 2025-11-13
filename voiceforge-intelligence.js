/**
 * VoiceForge Target Graph Intelligence
 * First-party attribution intelligence for protobuf.ai
 */

(function() {
    // Configuration
    const VOICEFORGE_API = 'https://api.voiceforge.ai/api/attribution/intelligence';
    const SITE_ID = 'protobuf-ai';
    
    // Browser fingerprinting for visitor identification
    function getFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('VoiceForge', 2, 2);
        
        const fingerprint = {
            canvas: canvas.toDataURL().slice(-50),
            screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            cores: navigator.hardwareConcurrency || 0,
            memory: navigator.deviceMemory || 0
        };
        
        // Create stable hash
        const fp = Object.values(fingerprint).join('|');
        return btoa(fp).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    }
    
    // Get or create visitor ID
    function getVisitorId() {
        let visitorId = localStorage.getItem('vf_visitor_id');
        if (!visitorId) {
            visitorId = `vf_${Date.now()}_${getFingerprint()}`;
            localStorage.setItem('vf_visitor_id', visitorId);
        }
        return visitorId;
    }
    
    // Get session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('vf_session_id');
        if (!sessionId) {
            sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            sessionStorage.setItem('vf_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Send intelligence to VoiceForge
    function captureIntelligence(eventType, eventData = {}) {
        const payload = {
            site_id: SITE_ID,
            visitor_id: getVisitorId(),
            session_id: getSessionId(),
            event_type: eventType,
            event_data: eventData,
            timestamp: new Date().toISOString(),
            page: {
                url: window.location.href,
                title: document.title,
                referrer: document.referrer,
                path: window.location.pathname
            },
            browser: {
                user_agent: navigator.userAgent,
                fingerprint: getFingerprint()
            }
        };
        
        // Check for attribution (obfuscated)
        const urlParams = new URLSearchParams(window.location.search);
        
        // Use multiple possible parameter names for obfuscation
        const attrParams = ['ref', 'src', 'utm_id', 'sid', 'u'];
        let attrCode = null;
        
        for (const param of attrParams) {
            attrCode = urlParams.get(param) || sessionStorage.getItem('vf_attr');
            if (attrCode) break;
        }
        
        if (attrCode) {
            // Decode the attribution
            try {
                // Simple obfuscation: base64 + rotation
                const decoded = atob(attrCode.replace(/[0-9]/g, '')).split('').map(c => 
                    String.fromCharCode(c.charCodeAt(0) - 3)
                ).join('');
                
                if (decoded.includes(':')) {
                    const [source, identifier] = decoded.split(':', 2);
                    payload.attribution = {
                        source: source,
                        identifier: identifier
                    };
                }
                
                sessionStorage.setItem('vf_attr', attrCode);
            } catch (e) {
                // Invalid attribution code, ignore
            }
        }
        
        // Send via beacon for reliability
        if (navigator.sendBeacon) {
            navigator.sendBeacon(VOICEFORGE_API, JSON.stringify(payload));
        } else {
            // Fallback to fetch
            fetch(VOICEFORGE_API, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                },
                keepalive: true
            }).catch(() => {}); // Silent fail
        }
    }
    
    // Capture page view intelligence
    captureIntelligence('page_view');
    
    // Capture time on page intelligence
    let startTime = Date.now();
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        captureIntelligence('page_exit', { time_on_page: timeOnPage });
    });
    
    // Capture click intelligence
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a, button, [data-track]');
        if (!target) return;
        
        const trackData = {
            element_type: target.tagName.toLowerCase(),
            element_text: target.textContent.trim().slice(0, 100),
            element_href: target.href || null,
            element_id: target.id || null,
            element_class: target.className || null
        };
        
        // Special intelligence for key actions
        if (target.href && target.href.includes('whitepaper')) {
            captureIntelligence('whitepaper_download', trackData);
        } else if (target.classList.contains('waitlist-submit')) {
            captureIntelligence('waitlist_signup_attempt', trackData);
        } else if (target.dataset.track) {
            captureIntelligence(target.dataset.track, trackData);
        } else {
            captureIntelligence('click', trackData);
        }
    });
    
    // Capture form submission intelligence
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.id === 'waitlist-form') {
            const email = form.querySelector('input[type="email"]')?.value;
            captureIntelligence('waitlist_signup', {
                email_domain: email ? email.split('@')[1] : null,
                form_id: form.id
            });
        }
    });
    
    // Capture scroll depth intelligence
    let maxScroll = 0;
    let scrollTimer;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
            const scrollPct = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
            if (scrollPct > maxScroll) {
                maxScroll = scrollPct;
                if (scrollPct >= 25 && scrollPct < 50) {
                    captureIntelligence('scroll_depth', { depth: 25 });
                } else if (scrollPct >= 50 && scrollPct < 75) {
                    captureIntelligence('scroll_depth', { depth: 50 });
                } else if (scrollPct >= 75 && scrollPct < 100) {
                    captureIntelligence('scroll_depth', { depth: 75 });
                } else if (scrollPct >= 100) {
                    captureIntelligence('scroll_depth', { depth: 100 });
                }
            }
        }, 100);
    });
    
    // Expose intelligence function globally
    window.vfIntel = captureIntelligence;
})();
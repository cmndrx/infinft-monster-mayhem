import fs from 'fs';
import path from 'path';
import os from 'os';
import vm from 'vm';
import { preparePlatformAnalytics } from '../../scripts/prepare-platform-analytics';

describe('Monster Mayhem platform analytics', () => {
  const originalLocation = window.location;
  let analytics;
  let events;
  beforeEach(() => {
    jest.resetModules();
    document.head.innerHTML = '';
    delete window.infinftAnalytics;
    delete process.env.REACT_APP_ANALYTICS_COLLECTOR_URL;
    Object.defineProperty(window, 'location', { configurable: true, value: new URL('https://infinft-monster-mayhem.web.app/') });
    events = jest.spyOn(window, 'addEventListener');
    analytics = require('./platformAnalytics');
  });
  afterEach(() => {
    for (const [name, handler] of events.mock.calls) window.removeEventListener(name, handler);
    events.mockRestore();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });
  test.each(['', 'http://analytics.example/', 'https://user:password@analytics.example/', 'https://analytics.example/path', 'https://analytics.example/?key=x'])('rejects an absent or unsafe collector: %s', (collector) => {
    process.env.REACT_APP_ANALYTICS_COLLECTOR_URL = collector;
    analytics.initializePlatformAnalytics();
    expect(document.querySelector('script')).toBeNull();
  });
  test.each([
    ['infinft-monster-mayhem.web.app', 'mayhem'],
    ['infinft-monster-mayhem.firebaseapp.com', 'mayhem'],
    ['infinft-monster-mayhem-dev.web.app', 'mayhem-dev'],
    ['infinft-monster-mayhem-dev.firebaseapp.com', 'mayhem-dev'],
  ])('maps %s to the correct platform once', (host, platform) => {
    process.env.REACT_APP_ANALYTICS_COLLECTOR_URL = 'https://analytics.example/';
    Object.defineProperty(window, 'location', { configurable: true, value: new URL(`https://${host}/`) });
    analytics.initializePlatformAnalytics();
    analytics.initializePlatformAnalytics();
    expect(document.querySelectorAll('script')).toHaveLength(1);
    const script = document.querySelector('script');
    expect(script.dataset).toMatchObject({ platform, endpoint: 'https://analytics.example/api/telemetry', consent: 'pending', consentUi: 'true', spa: 'true' });
    expect(script.getAttribute('src')).toBe('/infinft-analytics.js');
  });
  test('does not instrument localhost or an unlisted preview host', () => {
    process.env.REACT_APP_ANALYTICS_COLLECTOR_URL = 'https://analytics.example/';
    for (const host of ['localhost', 'preview.example', 'infinft-monster-mayhem.web.app.evil.example']) {
      Object.defineProperty(window, 'location', { configurable: true, value: new URL(`https://${host}/`) });
      analytics.initializePlatformAnalytics();
      expect(document.querySelector('script')).toBeNull();
    }
  });
  test('retains late auth through SDK load and consent regrant, and resets signout/anonymous users', () => {
    process.env.REACT_APP_ANALYTICS_COLLECTOR_URL = 'https://analytics.example/';
    analytics.setAnalyticsUser({ uid: 'example_user_123' });
    analytics.initializePlatformAnalytics();
    window.infinftAnalytics = { identify: jest.fn(), reset: jest.fn() };
    document.querySelector('script').onload();
    expect(window.infinftAnalytics.identify).toHaveBeenCalledWith('example_user_123');
    window.infinftAnalytics.identify.mockClear();
    window.dispatchEvent(new Event('infinft:analytics-consent-granted'));
    expect(window.infinftAnalytics.identify).toHaveBeenCalledWith('example_user_123');
    analytics.setAnalyticsUser(null);
    analytics.setAnalyticsUser({ uid: 'anonymous_user_123', isAnonymous: true });
    expect(window.infinftAnalytics.reset).toHaveBeenCalledTimes(2);
    window.infinftAnalytics.identify.mockImplementation(() => { throw new Error('SDK failure'); });
    expect(() => analytics.setAnalyticsUser({ uid: 'example_user_456' })).not.toThrow();
  });
  test('legacy shell gets the same env-gated bootstrap and no unrelated environment', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mayhem-analytics-'));
    try {
      fs.mkdirSync(path.join(dir, 'src/lib'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
      fs.copyFileSync(path.join(process.cwd(), 'src/lib/platformAnalytics.js'), path.join(dir, 'src/lib/platformAnalytics.js'));
      const output = preparePlatformAnalytics(dir, { REACT_APP_ANALYTICS_COLLECTOR_URL: 'https://analytics.example/', PRIVATE_TEST_VALUE: 'must_not_ship' });
      expect(output).not.toContain('must_not_ship');
      expect(output).not.toContain('process.env');
      vm.runInNewContext(output, { window, document, URL });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      const script = document.querySelector('script');
      expect(script.dataset.platform).toBe('mayhem');
      window.infinftAnalytics = { identify: jest.fn(), reset: jest.fn() };
      window.infinftMayhemPlatformAnalytics.setAnalyticsUser({ uid: 'legacy_user_123' });
      script.onload();
      expect(window.infinftAnalytics.identify).toHaveBeenCalledWith('legacy_user_123');
      const legacy = fs.readFileSync(path.join(process.cwd(), 'public/legacy/index.html'), 'utf8');
      expect(legacy).toContain('<script src="/infinft-platform-analytics.js"></script>');
      expect(legacy).toContain('window.infinftMayhemPlatformAnalytics?.setAnalyticsUser(user);');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

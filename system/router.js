// system/router.js - Client-side Router (Page.js-like)

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.params = {};
    
    // Listen to popstate for browser back/forward
    window.addEventListener('popstate', (e) => {
      this.resolve(window.location.pathname);
    });
    
    console.log('[Router] Initialized');
  }
  
  // Register route
  on(path, handler) {
    // Convert path pattern to regex
    const pattern = this.pathToRegex(path);
    
    this.routes.set(path, {
      path,
      pattern,
      handler,
      params: this.extractParamNames(path)
    });
    
    return this;
  }
  
  // Navigate to path
  navigate(path, data = {}) {
    // Update browser history
    window.history.pushState(data, '', path);
    
    // Resolve route
    this.resolve(path, data);
  }
  
  // Replace current route
  replace(path, data = {}) {
    window.history.replaceState(data, '', path);
    this.resolve(path, data);
  }
  
  // Go back
  back() {
    window.history.back();
  }
  
  // Go forward
  forward() {
    window.history.forward();
  }
  
  // Resolve current path
  resolve(path = window.location.pathname, data = {}) {
    for (const [routePath, route] of this.routes.entries()) {
      const match = path.match(route.pattern);
      
      if (match) {
        // Extract params
        const params = {};
        route.params.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        
        this.currentRoute = route;
        this.params = params;
        
        // Call handler
        try {
          route.handler({
            path,
            params,
            data,
            query: this.parseQuery(window.location.search)
          });
        } catch (error) {
          console.error('[Router] Handler error:', error);
        }
        
        return;
      }
    }
    
    // No route found - 404
    this.handleNotFound(path);
  }
  
  // Start router
  start() {
    this.resolve(window.location.pathname);
  }
  
  // Convert path pattern to regex
  pathToRegex(path) {
    // Replace :param with capturing group
    const pattern = path.replace(/:\w+/g, '([^/]+)');
    return new RegExp(`^${pattern}$`);
  }
  
  // Extract parameter names from path
  extractParamNames(path) {
    const matches = path.match(/:\w+/g);
    return matches ? matches.map(m => m.slice(1)) : [];
  }
  
  // Parse query string
  parseQuery(queryString) {
    const params = new URLSearchParams(queryString);
    const query = {};
    
    for (const [key, value] of params.entries()) {
      query[key] = value;
    }
    
    return query;
  }
  
  // Handle 404
  handleNotFound(path) {
    console.warn('[Router] Route not found:', path);
    
    // Check if there's a 404 handler
    const notFoundRoute = this.routes.get('*');
    if (notFoundRoute) {
      notFoundRoute.handler({ path, params: {}, data: {}, query: {} });
    }
  }
  
  // Get current route info
  getCurrent() {
    return {
      route: this.currentRoute,
      params: this.params,
      path: window.location.pathname,
      query: this.parseQuery(window.location.search)
    };
  }
  
  // Build URL with params
  buildUrl(path, params = {}) {
    let url = path;
    
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    }
    
    return url;
  }
  
  // Add query params to URL
  buildUrlWithQuery(path, query = {}) {
    const params = new URLSearchParams(query);
    const queryString = params.toString();
    
    return queryString ? `${path}?${queryString}` : path;
  }
}
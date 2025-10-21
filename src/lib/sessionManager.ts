/**
 * AcciZard Session Manager
 * Centralized session management - sessions persist until manual logout
 */

export interface SessionData {
  isLoggedIn: boolean;
  userType: 'admin' | 'superadmin';
  username: string;
  userId: string;
  name?: string;
  email?: string;
  timestamp: number;
  lastActivity: number;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'accizard_session';

  /**
   * Set a new session with user data
   */
  static setSession(data: Omit<SessionData, 'timestamp' | 'lastActivity'>) {
    const session: SessionData = {
      ...data,
      timestamp: Date.now(),
      lastActivity: Date.now()
    };
    
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Get current session data if valid
   */
  static getSession(): SessionData | null {
    try {
      const data = localStorage.getItem(this.SESSION_KEY);
      if (!data) return null;

      const session: SessionData = JSON.parse(data);
      
      // No timeout checks - sessions persist until manual logout
      return session;
    } catch (error) {
      console.error('Error reading session:', error);
      return null;
    }
  }

  /**
   * Refresh session activity timestamp
   */
  static refreshSession() {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      } catch (error) {
        console.error('Error refreshing session:', error);
      }
    }
  }

  /**
   * Clear session data
   */
  static clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      // Clear other session-related data
      localStorage.removeItem('viewedReports');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getSession();
    return session?.isLoggedIn ?? false;
  }

  /**
   * Get current user info
   */
  static getCurrentUser(): Omit<SessionData, 'timestamp' | 'lastActivity'> | null {
    const session = this.getSession();
    if (!session) return null;

    return {
      isLoggedIn: session.isLoggedIn,
      userType: session.userType,
      username: session.username,
      userId: session.userId,
      name: session.name,
      email: session.email
    };
  }

  /**
   * Check if current user is admin
   */
  static isAdmin(): boolean {
    const session = this.getSession();
    return session?.userType === 'admin';
  }

  /**
   * Check if current user is super admin
   */
  static isSuperAdmin(): boolean {
    const session = this.getSession();
    return session?.userType === 'superadmin';
  }

  /**
   * Get session age in milliseconds (time since session creation)
   */
  static getSessionAge(): number {
    const session = this.getSession();
    if (!session) return 0;
    return Date.now() - session.timestamp;
  }

  /**
   * Initialize session monitoring
   * Call this once in your app initialization
   */
  static initializeSessionMonitoring() {
    // No timeout monitoring needed - sessions persist until manual logout
    // Return empty cleanup function for consistency
    return () => {};
  }

  /**
   * Migrate old session data (for backward compatibility)
   * Call this once during app initialization
   */
  static migrateOldSession() {
    try {
      // Check for old session format
      const oldAdminLoggedIn = localStorage.getItem('adminLoggedIn');
      const oldAdminUsername = localStorage.getItem('adminUsername');
      
      if (oldAdminLoggedIn === 'true' && oldAdminUsername) {
        // Migrate to new format
        this.setSession({
          isLoggedIn: true,
          userType: 'admin',
          username: oldAdminUsername,
          userId: oldAdminUsername, // Use username as fallback
          name: oldAdminUsername
        });
        
        // Clean up old data
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        
        console.log('Migrated old session data to new format');
      }
    } catch (error) {
      console.error('Error migrating old session:', error);
    }
  }
}


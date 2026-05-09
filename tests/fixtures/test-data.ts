/**
 * Shared test data for ATDD scenarios.
 */
export const testUserData = {
  email: 'test@example.com',
  password: 'SecurePass123!',
};

export const mockElenaTips = {
  budgetExceeded: {
    message: 'Query too large for current budget.',
    quick_fixes: [
      { label: 'Select fewer columns', action: 'SELECT_COLUMNS' },
      { label: 'Add Date filter (Last 7 Days)', action: 'FILTER_DATE_7' }
    ]
  },
  unauthorized: {
    message: 'Session expired. Please refresh.',
    action: 'REFRESH_SESSION'
  }
};

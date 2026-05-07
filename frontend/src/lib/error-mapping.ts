/**
 * Utility to map technical OData error codes to business-friendly "Elena Tips".
 * [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Governance Signaling Patterns]
 */

export interface ElenaAdvice {
  title: string;
  message: string;
  advice: string;
  nextStepLink?: {
    label: string;
    href: string;
  };
}

export const mapErrorToElenaAdvice = (code: string, datasetId?: string): ElenaAdvice => {
  switch (code) {
    case 'BudgetExceeded':
      return {
        title: 'Query Too Large',
        message: 'Oops! This query is a bit too big for our current budget.',
        advice: 'Elena says: Try picking only the columns you really need or adding a date filter to reduce the scan size.',
        nextStepLink: {
          label: 'Adjust Filters',
          href: `/marketplace/${datasetId || ''}`
        }
      };

    case 'Unauthorized':
      return {
        title: 'Access Required',
        message: 'It looks like you don\'t have access to this data marketplace just yet.',
        advice: `Elena says: Contact your team lead to request access to the ${datasetId || 'requested'} dataset.`,
        nextStepLink: {
          label: 'Go Back',
          href: '/marketplace'
        }
      };

    case 'RateLimitExceeded':
      return {
        title: 'Taking a Breather',
        message: 'Slow down! You\'re moving faster than the data can keep up.',
        advice: 'Elena says: Take a quick coffee break and try again in a few minutes. We\'ll be ready when you are!',
        nextStepLink: {
          label: 'Try Again',
          href: '#'
        }
      };

    default:
      return {
        title: 'Something Unexpected',
        advice: 'Elena says: Double-check your connection or try refreshing the page. If it keeps happening, I'm here to help!',
        nextStepLink: {
          label: 'Refresh Page',
          href: '#'
        }
      };
  }
};

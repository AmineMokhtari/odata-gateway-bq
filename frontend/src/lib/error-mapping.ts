/**
 * Copyright 2026 Amine MOKHTARI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
          href: `/catalog/${datasetId || ''}`
        }
      };

    case 'Unauthorized':
      return {
        title: 'Access Required',
        message: 'It looks like you don\'t have access to this data catalog just yet.',
        advice: `Elena says: Contact your team lead to request access to the ${datasetId || 'requested'} dataset.`,
        nextStepLink: {
          label: 'Go Back',
          href: '/catalog'
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

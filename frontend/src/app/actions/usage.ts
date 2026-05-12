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

'use server'

export async function getGlobalUsage() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3002';
    const response = await fetch(`${baseUrl}/internal/usage`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error('Failed to fetch global usage:', err.message);
    return {
      totalBytesBilled: 0,
      lastJobs: [],
      budgetBytes: 1024 * 1024 * 1024 // Default 1GB
    };
  }
}

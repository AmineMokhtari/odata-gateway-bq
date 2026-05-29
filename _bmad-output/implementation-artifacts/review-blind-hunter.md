Please act as the Blind Hunter subagent for this review.

Invoke the `bmad-review-adversarial-general` skill.

Here is the diff to review:

```diff
diff --git a/.env b/.env
index b501cf4..bf2a5e2 100644
--- a/.env
+++ b/.env
@@ -4,10 +4,10 @@ BQ_DEFAULT_LOCATION="europe-west1"
 
 # OIDC Configuration (Azure AD / Entra ID)
 OIDC_ISSUER="https://login.microsoftonline.com/d775db05-664a-4055-ad03-861cde90a60c/v2.0"
-OIDC_AUDIENCE="3e553643-cffc-487b-8030-5ba9134a8df5"
+OIDC_AUDIENCE="9b776194-4c5b-4346-bfc2-9dd58ca7c4fd"
 
 # Development / Mocking
-ANONYMOUS_MODE=true
+ANONYMOUS_MODE=false
 DEFAULT_ANONYMOUS_USER_NAME="Amine MOKHTARI"
 TENANTS_CONFIG_PATH="dev-tenants.yaml"
 NEXT_PUBLIC_API_MOCKING=true
@@ -18,7 +18,8 @@ HUB_PORT=3000
 
 NEXT_PUBLIC_GATEWAY_URL=http://127.0.0.1:$HUB_PORT
 GATEWAY_URL=http://127.0.0.1:$GATEWAY_PORT
+HUB_URL=http://127.0.0.1:$HUB_PORT
 
 # Audit logs
 BQ_AUDIT_DATASET="obq_audit_logs"
-BQ_AUDIT_TABLE="api_audit"
+BQ_AUDIT_TABLE="api_audit"
\ No newline at end of file
diff --git a/.env.example b/.env.example
index b5a3786..84babb0 100644
--- a/.env.example
+++ b/.env.example
@@ -42,6 +42,7 @@ GATEWAY_PORT=80
 
 # Port for the Marketplace Frontend Hub (obq-hub). Defaults to 3000.
 HUB_PORT=3000
+HUB_URL=http://127.0.0.1:$HUB_PORT
 
 # 5. Audit Logging Options
 # ------------------------------------------------------------------------------
diff --git a/obq-gateway/src/config.ts b/obq-gateway/src/config.ts
index 24044e2..f04f9ba 100644
--- a/obq-gateway/src/config.ts
+++ b/obq-gateway/src/config.ts
@@ -43,7 +43,8 @@ export const config = {
   // App
   port: parseInt(process.env.GATEWAY_PORT || '80', 10),
   isDev: process.env.NODE_ENV !== 'production',
-  anonymousMode: process.env.ANONYMOUS_MODE === 'true'
+  anonymousMode: process.env.ANONYMOUS_MODE === 'true',
+  hubUrl: process.env.HUB_URL || 'http://localhost:3000'
 }
 
 /**
diff --git a/obq-gateway/src/routes/auth/index.ts b/obq-gateway/src/routes/auth/index.ts
index e3a154b..6b557dd 100644
--- a/obq-gateway/src/routes/auth/index.ts
+++ b/obq-gateway/src/routes/auth/index.ts
@@ -1,4 +1,5 @@
 import { FastifyPluginAsync } from 'fastify'
+import { config } from '../../config'
 
 const authRoutes: FastifyPluginAsync = async (fastify) => {
   fastify.get('/callback', async (request, reply) => {
@@ -21,8 +22,8 @@ const authRoutes: FastifyPluginAsync = async (fastify) => {
       request.session.set('user', sessionUser)
       request.session.set('tokens', token)
       
-      // Redirect to frontend preserving host and port (e.g. port 3005)
-      const targetUrl = `${request.getBaseUrl()}/`
+      // Redirect to frontend preserving host and port
+      const targetUrl = `${config.hubUrl}/`
       request.log.info({ targetUrl, correlationId: request.id }, 'OIDC callback successful, redirecting to frontend')
       return reply.redirect(targetUrl)
     } catch (err: any) {
diff --git a/obq-hub/src/app/actions/odata.ts b/obq-hub/src/app/actions/odata.ts
index 76050cb..ed8e1e8 100644
--- a/obq-hub/src/app/actions/odata.ts
+++ b/obq-hub/src/app/actions/odata.ts
@@ -249,7 +249,8 @@ export async function dryRunQueryAction(projectId: string, datasetId: string, en
           status: response.status,
           code: data.error?.code || 'ExplainFailed',
           message: data.error?.message || 'Explain failed',
-          details: data.error?.details || []
+          details: data.error?.details || [],
+          elena_tip: data.error?.elena_tip
         }
       };
     }
@@ -266,7 +267,8 @@ export async function dryRunQueryAction(projectId: string, datasetId: string, en
         status: err.status || 500,
         code: err.data?.error?.code || 'NetworkError',
         message: err.message || 'Network error during dry-run',
-        details: err.data?.error?.details || []
+        details: err.data?.error?.details || [],
+        elena_tip: err.data?.error?.elena_tip
       }
     };
   }
diff --git a/obq-hub/src/app/actions/tenants.ts b/obq-hub/src/app/actions/tenants.ts
index 689cf64..a6e7c63 100644
--- a/obq-hub/src/app/actions/tenants.ts
+++ b/obq-hub/src/app/actions/tenants.ts
@@ -16,6 +16,7 @@
 
 'use server'
 
+import { redirect } from 'next/navigation'
 import { readFileSync } from 'node:fs'
 import { join } from 'node:path'
 import yaml from 'js-yaml'
@@ -37,6 +38,11 @@ export async function getTenants(): Promise<TenantConfig[]> {
     const data = await response.json();
     return data.value || [];
   } catch (err: any) {
+    if (process.env.ANONYMOUS_MODE !== 'true') {
+      const target = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3005';
+      redirect(`${target}/auth/login`);
+    }
+
     console.warn('[getTenants] Failed to fetch tenants from backend, falling back to local config:', err.message);
     
     // Fallback to local file reading if backend is unavailable
diff --git a/obq-hub/src/components/drawers/ElenaDrawer.tsx b/obq-hub/src/components/drawers/ElenaDrawer.tsx
index f3e81e7..b1e3160 100644
--- a/obq-hub/src/components/drawers/ElenaDrawer.tsx
+++ b/obq-hub/src/components/drawers/ElenaDrawer.tsx
@@ -84,10 +84,16 @@ export const ElenaDrawer: React.FC = () => {
           {activeTip.action && !activeTip.quick_fixes && (
             <div className="pt-4">
               <Button 
-                onClick={() => applyFix(activeTip.action!)}
+                onClick={() => {
+                  if (activeTip.action === 'REFRESH_SESSION') {
+                    window.location.href = `${process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3005'}/auth/login`
+                  } else {
+                    applyFix(activeTip.action!)
+                  }
+                }}
                 className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded shadow-sm"
               >
-                Perform Action: {activeTip.action}
+                {activeTip.action === 'REFRESH_SESSION' ? 'Refresh Session' : `Perform Action: ${activeTip.action}`}
               </Button>
             </div>
           )}
diff --git a/obq-hub/src/lib/gateway-client.ts b/obq-hub/src/lib/gateway-client.ts
index a8967d9..dd16f2f 100644
--- a/obq-hub/src/lib/gateway-client.ts
+++ b/obq-hub/src/lib/gateway-client.ts
@@ -91,7 +91,13 @@ export class GatewayClient {
 
     if (!response.ok) {
       const errorData = await response.json().catch(() => ({}))
-      console.error(`[GatewayClient] Request failed: ${response.status} ${response.statusText}`, errorData)
+      
+      if (response.status === 401) {
+        console.warn(`[GatewayClient] Request failed: 401 Unauthorized`, errorData?.error?.message || '');
+      } else {
+        console.error(`[GatewayClient] Request failed: ${response.status} ${response.statusText}`, errorData)
+      }
+
       throw new ResponseError(
         errorData?.error?.message || response.statusText,
         response.status,
```

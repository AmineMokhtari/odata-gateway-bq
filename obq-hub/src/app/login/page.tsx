import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, ShieldCheck, ArrowRight } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <Card className="shadow-xl border-border bg-card/80 backdrop-blur-md">
          <CardHeader className="space-y-4 text-center pb-6 pt-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/20">
                <Database className="w-8 h-8" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
                Welcome
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm font-medium">
                Sign in to OData Gateway for BigQuery Hub
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-8 pb-10">
            <form
              action={async () => {
                "use server"
                await signIn("microsoft-entra-id", { redirectTo: "/" })
              }}
            >
              <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 bg-[#2F2F2F] hover:bg-[#1f1f1f] text-white border border-[#444]">
                <ShieldCheck className="w-5 h-5 text-white/80" />
                Sign in with Microsoft
                <ArrowRight className="w-5 h-5 opacity-70 ml-1" />
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-bold tracking-wider">
                  Secure Enterprise SSO
                </span>
              </div>
            </div>
            
            <p className="text-center text-xs text-muted-foreground px-4 leading-relaxed">
              By signing in, you agree to your organization's internal data handling and privacy policies.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

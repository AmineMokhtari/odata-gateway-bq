import { HeroSection } from "@/components/marketing/hero-section";
import Link from "next/link";
import { BookOpen, Code, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1">
        {/* Landing Hero Section */}
        <HeroSection />

        {/* Community & Documentation Footer-Link Section */}
        <div className="container mx-auto px-6 py-12 border-t border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Technical Resources
              </h2>
              <p className="text-slate-500 max-w-md">
                Dive deep into the architecture, security models, and deployment guides in our comprehensive documentation.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href="/docs" 
                className="inline-flex items-center px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
              >
                Explore Docs
              </Link>
              <a 
                href="https://github.com/your-repo/odata-gateway-bq" 
                target="_blank" 
                className="inline-flex items-center px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-sm gap-2"
              >
                <Code className="w-4 h-4" />
                View Source
              </a>
              <button className="inline-flex items-center px-5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-semibold hover:bg-amber-100 transition-colors gap-2">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                Star on GitHub
              </button>
            </div>
          </div>
          
          <div className="mt-12 text-center text-slate-400 text-sm font-medium">
            &copy; 2026 OData Gateway for BigQuery. Build with ❤️ for the Data Community.
          </div>
        </div>
      </main>
    </div>
  );
}

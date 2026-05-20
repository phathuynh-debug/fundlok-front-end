import { Card } from "@/components/ui/card"
import { FileText, Download, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DueDiligenceTab() {
  const { toast } = useToast()

  const documents = [
    { name: "Tax Filing 2025.pdf", date: "Uploaded 1/15/2026" },
    { name: "VAT Filing Q4 2025.pdf", date: "Uploaded 1/20/2026" },
    { name: "Financial Statement 2025.pdf", date: "Uploaded 1/25/2026" },
  ]

  const handleDownload = (filename: string) => {
    toast({
      title: "Downloading file",
      description: `Starting download for ${filename}...`,
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="p-6 md:p-8 rounded-2xl border shadow-sm bg-card space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Documents & Financial Information</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Review the SME's submitted documents for due diligence
          </p>
        </div>

        {/* Document List */}
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.date}</p>
                </div>
              </div>

              <button 
                onClick={() => handleDownload(doc.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hover:bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          ))}
        </div>

        {/* Reminder Box */}
        <div className="flex gap-3 p-4 rounded-xl border bg-amber-50/30 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Due Diligence Reminder
            </p>
            <p className="text-sm text-amber-700/90 dark:text-amber-300/90 leading-relaxed">
              Please review all documents carefully before investing. Consider the risk level and grading when making your investment decision.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, FileText } from "lucide-react"
import Image from "next/image"
interface CreateDialogProps {
  children: React.ReactNode;
}

export function CreateDialog({ children }: CreateDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">How do you want to start?</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Card One - Build an app with Omni */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-0">
              <div className="h-48 flex items-center justify-center">
                <img src="/assets/Omni_2x.png" alt="omni" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Build an app with Omni</h3>
                  <Badge className="text-xs bg-green-300 text-green-700">New</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Use AI to build a custom app tailored to your workflow.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card Two - Build an app on your own */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-0">
              <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <img src="/assets/start-with-data.png" alt="omni" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-lg mb-1">Build an app on your own</h3>
                <p className="text-sm text-gray-600">
                  Start with a blank app and build your ideal workflow.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

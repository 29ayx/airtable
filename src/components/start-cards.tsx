import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";
import { PiGridFour } from "react-icons/pi";
import { GoArrowUp } from "react-icons/go";
import { PiTable } from "react-icons/pi";
import { type ReactNode } from "react";

interface StartCardData {
  icon: ReactNode;
  title: string;
  description: string;
}

const startCardsData: StartCardData[] = [
  {
    icon: <Database className="h-6 w-6 text-blue-600" />,
    title: "Start with Omni",
    description: "Use AI to build a custom app tailored to your workflow"
  },
  {
    icon: <PiGridFour className="h-6 w-6 text-purple-800" />,
    title: "Start with templates",
    description: "Select a template to get started and customize as you go."
  },
  {
    icon: <GoArrowUp className="h-6 w-6 text-green-600" />,
    title: "Quickly upload",
    description: "Easily migrate your existing projects in just a few minutes."
  },
  {
    icon: <PiTable className="h-6 w-6 text-blue-500" />,
    title: "Build an app on your own",
    description: "Start with a blank app and build your ideal workflow."
  }
];

function StartCard({ data }: { data: StartCardData }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer max-h-[120px] pb-2">
      <CardContent>
        <div className="flex items-center gap-3 mb-2">
          {data.icon}
          <h3 className="font-semibold text-sm">{data.title}</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
      </CardContent>
    </Card>
  );
}

export function StartCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {startCardsData.map((cardData, index) => (
        <StartCard key={index} data={cardData} />
      ))}
    </div>
  );
}

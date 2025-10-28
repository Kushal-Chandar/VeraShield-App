import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle } from "lucide-react";

export default function TroubleshootingGuide() {
  const items = [
    {
      issue: "Device won't connect to Bluetooth",
      solutions: [
        "Ensure device can connect (Blue LED should blink)",
        "Make sure your phone's Bluetooth is enabled",
        "Clear app cache and restart the application",
        "If the Blue LED is not blinking restart device",
        "Check if device is within 10 meters range",
      ],
    },
    {
      issue: "Spray not working",
      solutions: [
        "Check if repellent cartridge needs replacement",
        "Ensure spray nozzle is not blocked",
        "Check if device is properly scheduled",
        "Perform manual spray test from device",
      ],
    },
    {
      issue: "App crashes or freezes",
      solutions: [
        "Force close and restart the app",
        "Update to the latest app version",
        "Restart your smartphone",
        "Clear app data and re-pair device",
        "Reinstall the application if problem persists",
      ],
    },
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Troubleshooting Guide</CardTitle>
        <CardDescription>Step-by-step solutions for common problems</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-2">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                {item.issue}
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-2">
                  {item.solutions.map((solution, sIndex) => (
                    <div key={sIndex} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{solution}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

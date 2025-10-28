import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail } from "lucide-react";

export default function ContactSupportCard() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Contact Support</CardTitle>
        <CardDescription>Get help from our technical support team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <Button variant="outline" className="justify-start gap-3 h-auto p-4" onClick={() => console.log("Opening phone support")}>
            <Phone className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium">Phone Support</div>
              <div className="text-sm text-gray-600">1-800-SHIELD (24/7)</div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start gap-3 h-auto p-4" onClick={() => console.log("Opening email support")}>
            <Mail className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <div className="font-medium">Email Support</div>
              <div className="text-sm text-gray-600">support@mosquitoshield.com</div>
            </div>
          </Button>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-100 text-blue-800 border-0">Tip</Badge>
          </div>
          <p className="text-sm text-blue-700">
            Have your device serial number ready when contacting support.
            You can find it in the device settings or on the product label.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
